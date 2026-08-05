import { createDebugger } from '@terraforge/core'
import { spawn } from 'node:child_process'

export type PluginServer = {
	protocol: string
	version: number
	endpoint: string

	kill: () => void
}

const debug = createDebugger('Server')

export const createPluginServer = (props: { file: string }) => {
	return new Promise<PluginServer>((resolve, reject) => {
		debug('init')

		const process = spawn(`${props.file}`, ['-debug'])

		let output = ''
		let settled = false

		const fail = (error: Error) => {
			if (!settled) {
				settled = true
				clearTimeout(timeout)
				process.kill()
				debug('failed')
				reject(error)
			}
		}

		const timeout = setTimeout(() => {
			fail(new Error('Timed out waiting for the plugin to start'))
		}, 10_000)

		process.on('error', fail)

		process.on('exit', (code, signal) => {
			if (!settled) {
				fail(new Error(`The plugin exited before it was ready (code ${code})`))
				return
			}

			// A plugin dying after startup is the usual cause of
			// "14 UNAVAILABLE: Connection dropped" call failures.
			debug('exited', code, signal)
		})

		process.stderr.on('data', (data: Buffer) => {
			// The provider's stderr holds the panic trace when it crashes.
			debug(data.toString('utf8'))
		})

		process.stdout.on('data', (data: Buffer) => {
			if (settled) {
				return
			}

			output += data.toString('utf8')

			const matches = output.match(/TF_REATTACH_PROVIDERS='(.*)'/)

			if (!matches) {
				// The handshake line may arrive split across chunks.
				return
			}

			try {
				const entries = Object.values(JSON.parse(matches[1]!))

				if (entries.length > 0) {
					const entry: any = entries[0]!
					const version: number = entry.ProtocolVersion
					const endpoint: string = entry.Addr.String

					settled = true
					clearTimeout(timeout)
					debug('started', endpoint)

					resolve({
						kill() {
							process.kill()
						},
						protocol: 'tfplugin' + version.toFixed(1),
						version,
						endpoint,
					})

					return
				}
			} catch (error) {}

			fail(new Error('Failed to start the plugin'))
		})
	})
}

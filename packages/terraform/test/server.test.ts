import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPluginServer } from '../src/plugin/server'

describe('plugin server', () => {
	const reattach = JSON.stringify({
		'registry.terraform.io/example/example': {
			ProtocolVersion: 6,
			Addr: { String: '/tmp/plugin.sock' },
		},
	})

	let dir: string

	const createFakePlugin = async (name: string, script: string) => {
		const file = join(dir, name)
		await writeFile(file, `#!/bin/sh\n${script}`)
		await chmod(file, 0o755)
		return file
	}

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'terraforge-server-'))
	})

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	it('should parse the handshake and resolve', async () => {
		const file = await createFakePlugin(
			'ok',
			`printf "TF_REATTACH_PROVIDERS='%s'\\n" '${reattach}'\nsleep 5`
		)

		const server = await createPluginServer({ file })

		expect(server.version).toBe(6)
		expect(server.protocol).toBe('tfplugin6.0')
		expect(server.endpoint).toBe('/tmp/plugin.sock')

		server.kill()
	})

	it('should parse a handshake split across multiple writes', async () => {
		const file = await createFakePlugin(
			'split',
			`printf "TF_REATTACH_PROVIDERS="\nsleep 0.1\nprintf "'%s'\\n" '${reattach}'\nsleep 5`
		)

		const server = await createPluginServer({ file })

		expect(server.version).toBe(6)

		server.kill()
	})

	it('should survive a plugin that logs stderr and dies after the handshake', async () => {
		const file = await createFakePlugin(
			'dies',
			`printf "TF_REATTACH_PROVIDERS='%s'\\n" '${reattach}'\necho "panic: something broke" >&2\nexit 2`
		)

		const server = await createPluginServer({ file })

		expect(server.version).toBe(6)

		// Give the exit event time to fire — it must only debug-log,
		// not throw or reject anything.
		await new Promise(resolve => setTimeout(resolve, 200))

		server.kill()
	})

	it('should reject instead of crash for a missing binary', async () => {
		await expect(createPluginServer({ file: join(dir, 'missing') })).rejects.toThrow()
	})

	it('should reject when the plugin exits before the handshake', async () => {
		const file = await createFakePlugin('exits', 'exit 1')

		await expect(createPluginServer({ file })).rejects.toThrow('exited before it was ready')
	})

	it('should reject for garbage handshake output', async () => {
		const file = await createFakePlugin(
			'garbage',
			`echo "TF_REATTACH_PROVIDERS='not json'"\nsleep 5`
		)

		await expect(createPluginServer({ file })).rejects.toThrow('Failed to start the plugin')
	})
})

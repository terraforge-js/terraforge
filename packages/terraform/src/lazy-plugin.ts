import { createPluginClient } from './plugin/client'
import { downloadPlugin, DownloadPluginProps } from './plugin/download'
import { createPluginServer } from './plugin/server'
import { createPlugin5 } from './plugin/version/5'
import { createPlugin6 } from './plugin/version/6'
import { Plugin } from './plugin/version/type'

export const createLazyPlugin = (props: DownloadPluginProps & { location?: string }) => {
	return async () => {
		const { file } = await downloadPlugin(props)

		const server = await retry(3, () => createPluginServer({ file, debug: false }))
		const client = await retry(3, () => createPluginClient(server))
		const plugins: Record<number, () => Promise<Plugin>> = {
			5: () => createPlugin5({ server, client }),
			6: () => createPlugin6({ server, client }),
		}

		const plugin = await plugins[server.version]?.()

		if (!plugin) {
			throw new Error(`No plugin client available for protocol version ${server.version}`)
		}

		return plugin
	}
}

const retry = async <T>(tries: number, cb: () => Promise<T>): Promise<T> => {
	let latestError: unknown

	while (--tries) {
		try {
			const result = await cb()
			return result
		} catch (error) {
			latestError = error
		}
	}

	throw latestError
}

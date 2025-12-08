import { createLazyPlugin } from './lazy-plugin.ts'
import { downloadPlugin } from './plugin/download.ts'
import type { Version } from './plugin/registry.ts'
import { TerraformProvider } from './provider.ts'
import { createResourceProxy } from './resource.ts'

export type TerraformProviderConfig = {
	id?: string
	location?: string
}

type InstallProps = {
	location?: string
}

export const createTerraformAPI = <T>(props: {
	namespace: string
	provider: {
		org: string
		type: string
		version: Version
	}
}): T => {
	const resource = createResourceProxy(props.namespace)
	const install = async ({ location }: InstallProps) => {
		await downloadPlugin({ ...props.provider, location })
	}

	const createPlugin = ({ location }: { location?: string }) => {
		return createLazyPlugin({ ...props.provider, location })
	}

	return new Proxy(() => {}, {
		apply(_, _this, [input, config]: [Record<string, unknown>, TerraformProviderConfig]) {
			return new TerraformProvider(
				props.namespace,
				config?.id ?? 'default',
				createPlugin({ location: config?.location }),
				input
			)
		},
		get(_, prop) {
			if (prop === 'install') {
				return install
			}

			return resource
		},
	}) as T
}

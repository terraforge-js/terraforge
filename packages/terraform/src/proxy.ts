import type { Config, Node, Resource, ResourceConfig, State } from '@terraforge/core'
import { createMeta, Group, nodeMetaSymbol } from '@terraforge/core'
import { pascalCase, snakeCase } from 'change-case'
import { createLazyPlugin } from './lazy-plugin'
import { deletePlugin, downloadPlugin, isPluginInstalled } from './plugin/download'
import { Version } from './plugin/registry'
import { TerraformProvider } from './provider'

type Klass = { new (): object }

const classMap = new Map<string, Klass>()

const getClass = (type: string): Klass => {
	if (!classMap.has(type)) {
		classMap.set(type, class {})
	}

	return classMap.get(type)!
}

const createResourceProxy = (klass: Klass, cb: (key: string | symbol) => unknown) => {
	return new Proxy(
		{},
		{
			get(_, key) {
				return cb(key)
			},
			set(_, key) {
				if (typeof key === 'string') {
					throw new Error(`Cannot set property ${key} on read-only object.`)
				}

				throw new Error(`This object is read-only.`)
			},
			getPrototypeOf() {
				return klass.prototype
			},
		}
	)
}

const createNamespaceProxy = (cb: (key: string) => unknown) => {
	const cache = new Map<string, unknown>()
	return new Proxy(
		{},
		{
			get(_, key) {
				if (typeof key === 'string') {
					if (!cache.has(key)) {
						const value = cb(key)
						cache.set(key, value)
					}

					return cache.get(key)
				}

				return
			},
			set(_, key) {
				if (typeof key === 'string') {
					throw new Error(`Cannot set property ${key} on read-only object.`)
				}

				throw new Error(`This object is read-only.`)
			},
		}
	)
}

const createRootProxy = (apply: (...args: any[]) => object, get: (key: string) => any) => {
	const cache = new Map<string, unknown>()

	return new Proxy(() => {}, {
		apply(_, _this, args) {
			return apply(...args)
		},
		get(_, key) {
			if (typeof key === 'string') {
				if (!cache.has(key)) {
					const value = get(key)
					cache.set(key, value)
				}

				return cache.get(key)
			}

			return
		},
	})
}

const createClassProxy = (
	name: string,
	target: Klass,
	construct: (...args: any[]) => object,
	get: (...args: any[]) => object
) => {
	return new Proxy(target, {
		construct(_, args) {
			return construct(...args)
		},
		get(_, key) {
			if (key === 'prototype') {
				return target.prototype
			}

			if (key === 'name') {
				return name
			}

			if (key === 'get') {
				return (...args: any[]) => {
					return get(...args)
				}
			}

			return
		},
	})
}

const createRecursiveProxy = ({
	provider,
	install,
	uninstall,
	isInstalled,
	class: klass,
	resource,
	dataSource,
}: {
	provider: (...args: any[]) => TerraformProvider
	install: (...args: any[]) => Promise<void>
	uninstall: (...args: any[]) => Promise<void>
	isInstalled: (...args: any[]) => Promise<boolean>
	class: (ns: string[]) => Klass
	resource: (ns: string[], ...args: any[]) => object
	dataSource: (ns: string[], ...args: any[]) => object
}) => {
	const findNextProxy = (ns: string[], name: string): any => {
		if (name === name.toLowerCase()) {
			return createNamespaceProxy(key => {
				return findNextProxy([...ns, name], key)
			})
		} else if (name.startsWith('get')) {
			return (...args: any[]) => {
				return dataSource([...ns, name.substring(3)], ...args)
			}
		} else {
			return createClassProxy(
				pascalCase([...ns, name].join('-')),
				klass([...ns, name]),
				(...args) => {
					return resource([...ns, name], ...args)
				},
				(...args) => {
					return dataSource([...ns, name], ...args)
				}
			)
		}
		// })
	}

	return createRootProxy(provider, key => {
		if (key === 'install') {
			return install
		}
		if (key === 'uninstall') {
			return uninstall
		}
		if (key === 'isInstalled') {
			return isInstalled
		}

		return findNextProxy([], key)
	})
}

export type TerraformProviderConfig = {
	id?: string
	location?: string
}

export type InstallProps = {
	location?: string
}

export const createTerraformProxy = (props: {
	namespace: string
	provider: {
		org: string
		type: string
		version: Version
	}
}) => {
	return createRecursiveProxy({
		provider(input: Record<string, unknown>, config?: TerraformProviderConfig) {
			return new TerraformProvider(
				props.namespace,
				config?.id ?? 'default',
				createLazyPlugin({
					...props.provider,
					location: config?.location,
				}),
				input
			)
		},
		async install(installProps?: InstallProps) {
			await downloadPlugin({ ...props.provider, ...installProps })
		},
		async uninstall(installProps?: InstallProps) {
			await deletePlugin({ ...props.provider, ...installProps })
		},
		isInstalled(installProps?: InstallProps) {
			return isPluginInstalled({ ...props.provider, ...installProps })
		},
		class: (ns: string[]) => {
			const type = snakeCase([props.namespace, ...ns].join('_'))
			return getClass(type)
		},
		resource: (ns: string[], parent: Group, id: string, input: State, config?: ResourceConfig) => {
			const type = snakeCase([props.namespace, ...ns].join('_'))
			const provider = `terraform:${props.namespace}:${config?.provider ?? 'default'}`
			const meta = createMeta('resource', provider, parent, type, id, input, config)
			const resource = createResourceProxy(getClass(type), key => {
				if (typeof key === 'string') {
					if (key === 'urn') {
						return meta.urn
					}

					return meta.output(data => data[key])
				} else if (key === nodeMetaSymbol) {
					return meta
				}

				return
			}) as Resource

			parent.add(resource)

			return resource
		},
		dataSource: (ns: string[], parent: Group, id: string, input: State, config?: Config) => {
			const type = snakeCase([props.namespace, ...ns].join('_'))
			const provider = `terraform:${props.namespace}:${config?.provider ?? 'default'}`
			const meta = createMeta('data', provider, parent, type, id, input, config)

			const dataSource = createResourceProxy(getClass(type), key => {
				if (typeof key === 'string') {
					if (key === 'urn') {
						return meta.urn
					}

					return meta.output(data => data[key])
				} else if (key === nodeMetaSymbol) {
					return meta
				}

				return
			}) as Node

			parent.add(dataSource)

			return dataSource
		},
	})
}

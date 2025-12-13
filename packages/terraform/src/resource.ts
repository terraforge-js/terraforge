import type { Config, Node, Resource, ResourceConfig, State } from '@terraforge/core'
import { createMeta, Group, nodeMetaSymbol } from '@terraforge/core'
import { snakeCase } from 'change-case'

const createNamespaceProxy = (cb: (key: string) => unknown, scb?: (key: symbol) => unknown) => {
	const cache = new Map<string | symbol, unknown>()
	return new Proxy(
		{},
		{
			get(_, key: string | symbol) {
				if (!cache.has(key)) {
					const value = typeof key === 'symbol' ? scb?.(key) : cb(key)
					cache.set(key, value)
				}

				return cache.get(key)
			},
			set(_, key: string | symbol) {
				if (typeof key === 'string') {
					throw new Error(`Cannot set property ${key} on read-only object.`)
				}

				throw new Error(`This object is read-only.`)
			},
		}
	)
}

// type Construct = (
//   names: string[],
//   parent: Group,
//   id: string,
//   input: State,
//   config?: ResourceConfig
// ) => object;

// type Get = (logicalId: string, physicalId: string) => object

const createClassProxy = (construct: (...args: any[]) => object, get: (...args: any[]) => object) => {
	return new Proxy(class {}, {
		construct(_, args) {
			return construct(...args)
		},
		get(_, key) {
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
	resource,
	dataSource,
}: {
	resource: (ns: string[], ...args: any[]) => object
	dataSource: (ns: string[], ...args: any[]) => object
}) => {
	const createProxy = (names: string[]): any => {
		return createNamespaceProxy(name => {
			const ns = [...names, name]
			if (name === name.toLowerCase()) {
				return createProxy(ns)
			} else if (name.startsWith('get')) {
				return (...args: any[]) => {
					return dataSource([...names, name.substring(3)], ...args)
				}
			} else {
				return createClassProxy(
					(...args) => {
						return resource(ns, ...args)
					},
					(...args) => {
						return dataSource(ns, ...args)
					}
				)
			}
		})
	}

	return createProxy([])
}

export const createResourceProxy = (name: string) => {
	return createRecursiveProxy({
		resource: (ns: string[], parent: Group, id: string, input: State, config?: ResourceConfig) => {
			const type = snakeCase(name + '_' + ns.join('_'))
			const provider = `terraform:${name}:${config?.provider ?? 'default'}`
			const meta = createMeta('resource', provider, parent, type, id, input, config)
			const resource = createNamespaceProxy(
				key => {
					return meta.output(data => data[key])
				},
				key => {
					if (key === nodeMetaSymbol) {
						return meta
					}
					return
				}
			) as Resource

			// $.attach(resource)

			parent.add(resource)

			return resource
		},
		// external: (ns: string[], id: string, input: State, config?: ResourceConfig) => {
		// 	const type = snakeCase(ns.join('_'))
		// 	const provider = `terraform:${ns[0]}:${config?.provider ?? 'default'}`
		// 	const $ = createResourceMeta(provider, type, id, input, config)
		// 	const resource = createNamespaceProxy(
		// 		key => {
		// 			if (key === '$') {
		// 				return $
		// 			}

		// 			return $.output(data => data[key])
		// 		},
		// 		{ $ }
		// 	) as Resource

		// 	parent.add(resource)

		// 	return resource
		// },
		// (ns: string[], parent: Group, id: string, input: State, config?: ResourceConfig)
		dataSource: (ns: string[], parent: Group, id: string, input: State, config?: Config) => {
			const type = snakeCase(name + '_' + ns.join('_'))
			const provider = `terraform:${name}:${config?.provider ?? 'default'}`
			const meta = createMeta('data', provider, parent, type, id, input, config)

			const dataSource = createNamespaceProxy(
				key => {
					return meta.output(data => data[key])
				},
				key => {
					if (key === nodeMetaSymbol) {
						return meta
					}
					return
				}
			) as Node

			parent.add(dataSource)

			return dataSource
		},
	})
}

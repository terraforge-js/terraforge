import type { Config, Node, Resource, ResourceConfig, State } from '@terraforge/core'
import { createMeta, Group } from '@terraforge/core'
import { snakeCase } from 'change-case'

const createNamespaceProxy = (cb: (key: string) => unknown, target = {}) => {
	const cache = new Map<string, unknown>()
	return new Proxy(target, {
		get(_, key: string) {
			if (!cache.has(key)) {
				cache.set(key, cb(key))
			}

			return cache.get(key)
		},
		set(_, key: string) {
			throw new Error(`Cannot assign to ${key} because it is a read-only property.`)
		},
	})
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
			const $ = createMeta('resource', provider, parent, type, id, input, config)
			const resource = createNamespaceProxy(
				key => {
					if (key === '$') {
						return $
					}

					return $.output(data => data[key])
				},
				{ $ }
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

			// console.log('INPUT', ns, parent, id, input, config)

			const $ = createMeta('data', provider, parent, type, id, input, config)

			const dataSource = createNamespaceProxy(
				key => {
					if (key === '$') {
						return $
					}

					return $.output(data => data[key])
				},
				{ $ }
			) as Node

			parent.add(dataSource)

			return dataSource
		},
	})
}

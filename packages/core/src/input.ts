import { Future } from './future.ts'
import { Meta } from './meta.ts'
import { Output } from './output.ts'

export type Input<T = unknown> = T | Output<T> | Future<T> | Promise<T>
export type OptionalInput<T = unknown> = Input<T> | Input<T | undefined> | Input<undefined>

export type UnwrapInputArray<T extends Input[]> = {
	[K in keyof T]: UnwrapInput<T[K]>
}

export type UnwrapInput<T> = T extends Input<infer V> ? V : T

// export const findUnresolvedInputs = (props: unknown) => {
//   const inputs: Array<Output | Future | Promise<unknown>> = [];

//   const find = (props: unknown) => {
//     if (
//       props instanceof Output ||
//       props instanceof Future ||
//       props instanceof Promise
//     ) {
//       inputs.push(props);
//     } else if (Array.isArray(props)) {
//       props.map(find);
//     } else if (props?.constructor === Object) {
//       Object.values(props).map(find);
//     }
//   };

//   find(props);

//   return inputs;
// };

export const findInputDeps = (props: unknown) => {
	const deps: Array<Meta> = []

	const find = (props: unknown) => {
		if (props instanceof Output) {
			deps.push(...props.dependencies)
		} else if (Array.isArray(props)) {
			props.map(find)
		} else if (props?.constructor === Object) {
			Object.values(props).map(find)
		}
	}

	find(props)

	return deps
}

const resolveWithTimeout = async (promise: Output | Future<unknown> | Promise<unknown>) => {
	let timeout
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => {
				timeout = setTimeout(() => {
					if (promise instanceof Output) {
						reject(
							new Error(
								`Resolving Output<${[...promise.dependencies].map(d => d.urn).join(', ')}> took too long.`
							)
						)
					} else if (promise instanceof Future) {
						reject(new Error('Resolving Future took too long.'))
					} else {
						reject(new Error('Resolving Promise took too long.'))
					}
				}, 3000)
			}),
		])
	} finally {
		clearTimeout(timeout)
	}
}

// Resolves every Output / Future / Promise in the input structure into a new
// structure, without mutating the caller's inputs. The Output instances inside
// a node's input are its dependency edges, so the original structure must stay
// intact across deploys.
//
// When a fallback is given, a value that fails to resolve is substituted with
// the fallback's value for that path instead of aborting the whole resolve.
export const resolveInputs = async <T>(
	inputs: T,
	fallback?: (path: Array<string | number>) => unknown
): Promise<T> => {
	const resolve = async (value: unknown, path: Array<string | number>): Promise<unknown> => {
		if (value instanceof Output || value instanceof Future || value instanceof Promise) {
			try {
				return await resolveWithTimeout(value)
			} catch (error) {
				if (fallback) {
					return fallback(path)
				}

				throw error
			}
		}

		if (Array.isArray(value)) {
			return Promise.all(value.map((item, index) => resolve(item, [...path, index])))
		}

		if (value?.constructor === Object) {
			const entries = Object.entries(value)
			const resolved = await Promise.all(entries.map(([key, item]) => resolve(item, [...path, key])))
			const result: Record<string, unknown> = {}

			entries.forEach(([key], i) => {
				result[key] = resolved[i]
			})

			return result
		}

		return value
	}

	return resolve(inputs, []) as Promise<T>
}

// function promiseRecursive(obj) {
//     const getPromises = obj =>
//         Object.keys(obj).reduce( (acc, key) =>
//             Object(obj[key]) !== obj[key]
//                 ? acc
//                 : acc.concat(
//                     typeof obj[key].then === "function"
//                         ? [[obj, key]]
//                         : getPromises(obj[key])
//                   )
//         , []);
//     const all = getPromises(obj);
//     return Promise.all(all.map(([obj, key]) => obj[key])).then( responses =>
//         (all.forEach( ([obj, key], i) => obj[key] = responses[i]), obj)
//     );
// }

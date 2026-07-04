// import { run, Step } from 'promise-dag'
import { DirectedGraph } from 'graphology'
import { topologicalGenerations, willCreateCycle } from 'graphology-dag'
import { State } from '../meta.ts'
import { Output } from '../output.ts'
import { URN } from '../urn.ts'
import { entries } from './entries.ts'

// export class DependencyGraph {
// 	private graph: Record<URN, Step[]> = {}

// 	add(urn: URN, deps: URN[], callback: () => Promise<void>) {
// 		this.graph[urn] = [...deps, callback]
// 	}

// 	run() {
// 		return Promise.allSettled(Object.values(run(this.graph)))
// 	}
// }

export class DependencyGraph {
	private graph = new DirectedGraph()
	private callbacks = new Map<URN, () => Promise<void>>()

	add(urn: URN, deps: URN[], callback: () => Promise<void>) {
		this.callbacks.set(urn, callback)

		this.graph.mergeNode(urn)

		for (const dep of deps) {
			if (!dep) {
				throw new Error(`Resource ${urn} has an undefined dependency.`)
			}

			if (willCreateCycle(this.graph, dep, urn)) {
				throw new Error(`There is a circular dependency between ${urn} -> ${dep}`)
			}

			this.graph.mergeEdge(dep, urn)
		}
	}

	validate() {
		const nodes = this.graph.nodes() as URN[]

		for (const urn of nodes) {
			if (!this.callbacks.has(urn)) {
				const deps = this.graph.filterNodes(node => {
					return this.graph.areNeighbors(node, urn)
				})

				throw new Error(`The following resources ${deps.join(', ')} have a missing dependency: ${urn}`)
			}
		}
	}

	async run() {
		this.validate()

		const graph = topologicalGenerations(this.graph) as URN[][]
		const errors: Error[] = []

		for (const list of graph) {
			const result = await Promise.allSettled(
				list.map(urn => {
					const callback = this.callbacks.get(urn)

					if (!callback) {
						return
					}

					return callback()
				})
			)

			for (const entry of result) {
				if (entry.status === 'rejected') {
					if (entry.reason instanceof Error) {
						errors.push(entry.reason)
					} else {
						errors.push(new Error(`Unknown error: ${entry.reason}`))
					}
				}
			}

			if (errors.length > 0) {
				break
			}
		}

		return errors

		// return Promise.allSettled(Object.values(run(this.graph)))
	}
}

export const dependentsOn = (resources: Record<URN, { dependencies: URN[] }>, dependency: URN) => {
	const dependents: URN[] = []

	for (const [urn, resource] of entries(resources)) {
		if (resource.dependencies.includes(dependency)) {
			dependents.push(urn)
		}
	}

	return dependents
}

// Find input paths that reference a specific dependency Output.
export const findDependencyPaths = (value: unknown, dependencyUrn: URN, path: Array<string | number> = []) => {
	const paths: Array<Array<string | number>> = []

	const visit = (current: unknown, currentPath: Array<string | number>) => {
		if (current instanceof Output) {
			for (const dep of current.dependencies) {
				if (dep.urn === dependencyUrn) {
					paths.push(currentPath)
					return
				}
			}
			return
		}

		if (Array.isArray(current)) {
			current.forEach((item, index) => {
				visit(item, [...currentPath, index])
			})
			return
		}

		if (current && typeof current === 'object') {
			for (const [key, item] of Object.entries(current)) {
				visit(item, [...currentPath, key])
			}
		}
	}

	visit(value, path)
	return paths
}

export const getAtPath = (value: unknown, path: Array<string | number>) => {
	let current: any = value

	for (const key of path) {
		if (current == null) {
			return undefined
		}

		current = current[key]
	}

	return current
}

const cloneState = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const removeAtPath = (target: any, path: Array<string | number>) => {
	if (path.length === 0) return

	let parent = target
	for (let i = 0; i < path.length - 1; i++) {
		if (parent == null) return
		parent = parent[path[i] as keyof typeof parent]
	}

	const last = path[path.length - 1]
	if (Array.isArray(parent) && typeof last === 'number') {
		if (last >= 0 && last < parent.length) {
			parent.splice(last, 1)
		}
		return
	}

	if (parent && typeof parent === 'object') {
		delete parent[last as keyof typeof parent]
	}
}

// Build a copy of input with the dependency references removed.
export const stripDependencyInputs = (input: State, metaInput: State, dependencyUrn: URN) => {
	const paths = findDependencyPaths(metaInput, dependencyUrn)
	if (paths.length === 0) {
		return input
	}

	const detached = cloneState(input)
	const sortedPaths = [...paths].sort((a, b) => {
		if (a.length !== b.length) return b.length - a.length
		const aLast = a[a.length - 1]
		const bLast = b[b.length - 1]
		if (typeof aLast === 'number' && typeof bLast === 'number') {
			return bLast - aLast
		}
		return 0
	})

	for (const path of sortedPaths) {
		removeAtPath(detached, path)
	}

	return detached
}

export const allowsDependentReplace = (
	replaceOnChanges: string[] | undefined,
	dependencyPaths: Array<Array<string | number>>
) => {
	if (!replaceOnChanges || replaceOnChanges.length === 0) {
		return false
	}

	for (const path of dependencyPaths) {
		const base = typeof path[0] === 'string' ? path[0] : undefined
		if (!base) {
			continue
		}

		for (const replacePath of replaceOnChanges) {
			if (
				replacePath === base ||
				replacePath.startsWith(`${base}.`) ||
				replacePath.startsWith(`${base}[`) ||
				replacePath.startsWith(`${base}.*`)
			) {
				return true
			}
		}
	}

	return false
}

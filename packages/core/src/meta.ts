// import { type DataSource } from './data-source.ts'
import { Group } from './group.ts'
import { findInputDeps } from './input.ts'
import { Output } from './output.ts'
import { type Resource } from './resource.ts'
import { findParentStack, Stack } from './stack.ts'
import { createUrn, type URN } from './urn.ts'

// export const isNode = (obj: object): obj is { $: { tag: string } } => {
// 	return '$' in obj && typeof obj.$ === 'object' && obj.$ !== null && 'tag' in obj.$ && typeof obj.$.tag === 'string'
// }

// export const isResource = (obj: object): obj is Resource => {
// 	return isNode(obj) && obj.$.tag === 'resource'
// }

// export const isDataSource = (obj: object): obj is DataSource => {
// 	return isNode(obj) && obj.$.tag === 'data'
// }

export type Tag = 'resource' | 'data'
export type State = Record<string, unknown>

export type Config = {
	/** Specify additional explicit dependencies in addition to the ones in the dependency graph. */
	dependsOn?: Resource<any, any>[]

	/** Pass an ID of an explicitly configured provider, instead of using the default provider. */
	provider?: string
}

export type Meta<T extends Tag = Tag, I extends State = State, O extends State = State, C extends Config = Config> = {
	readonly tag: T
	readonly urn: URN
	readonly logicalId: string
	readonly type: string
	readonly stack: Stack
	readonly provider: string
	readonly input: I
	readonly config?: C
	readonly dependencies: Set<URN>

	// readonly attach: (resource: Resource<I, O, T>) => void
	// readonly attachDependencies: (props: unknown) => void
	readonly resolve: (data: O) => void
	readonly output: <O>(cb: (data: State) => O) => Output<O>
}

// export type Node<T extends Tag = Tag, I extends State = State, O extends State = State, C extends Config = Config> = {
// 	$: Meta<T, I, O, C>
// } & O

export const createMeta = <
	T extends Tag = Tag,
	I extends State = State,
	O extends State = State,
	C extends Config = Config,
>(
	tag: T,
	provider: string,
	parent: Group,
	type: string,
	logicalId: string,
	input: I,
	config?: C
): Meta<T, I, O, C> => {
	const urn = createUrn(tag, type, logicalId, parent.urn)
	const stack = findParentStack(parent)

	let output: O | undefined

	return {
		tag,
		urn,
		logicalId,
		type,
		stack,
		provider,
		input,
		config,
		get dependencies() {
			const dependencies = new Set<URN>()
			const linkMetaDep = (dep: Meta) => {
				if (dep.urn === urn) {
					throw new Error("You can't depend on yourself")
				}

				dependencies.add(dep.urn)
			}

			for (const dep of findInputDeps(input)) {
				linkMetaDep(dep)
			}
			for (const dep of config?.dependsOn ?? []) {
				linkMetaDep(dep.$)

				// if (dep.$.stack.urn === stack.urn) {
				// 	dependencies.add(dep.$.urn)
				// } else {
				// 	stack.dependsOn(dep.$.stack)
				// }
			}
			return dependencies
		},
		// attach(value) {
		// 	resource = value
		// },
		// dependOn(...resources: Resource[]) {},
		// attachDependencies(props) {
		// 	for (const dep of findInputDeps(props)) {
		// 		linkMetaDep(dep)
		// 	}
		// },
		resolve(data) {
			output = data
		},
		output<V>(cb: (data: State) => V) {
			return new Output<V>(new Set([this as Meta]), resolve => {
				if (!output) {
					throw new Error(`Unresolved output for ${tag}: ${urn}`)
				}

				resolve(cb(output))
			})
		},
	}
}

// stack.on('deploy', workspace => {
// 	resource.deploy(workspace)
// })

// resource.on('deploy', workspace => {
// 	datasource.deploy(workspace)
// })

// dataSource.on('deploy', workspace => {
// 	datasource.deploy(workspace)
// })

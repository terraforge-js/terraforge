import {
	App,
	createCustomProvider,
	createCustomResourceClass,
	Input,
	MemoryLockBackend,
	MemoryStateBackend,
	OptionalInput,
	OptionalOutput,
	Output,
	ResourceNotFound,
	State,
	WorkSpace,
} from '../src'
import { Hooks } from '../src/workspace/hooks'

export const createMockProvider = (config?: { requireReplacement?: boolean }) => {
	const parseState = (state: unknown) => {
		if (typeof state === 'object' && state !== null) {
			return {
				id: parseStateId(state),
				deps: parseStateDeps(state),
			}
		}

		throw new Error('Invalid resource state.')
	}

	const parseStateId = (state: object) => {
		if ('id' in state && typeof state.id === 'string') {
			return state.id
		}

		throw new Error('Resource ID is required.')
	}

	const parseStateDeps = (state: object) => {
		if ('deps' in state && Array.isArray(state.deps)) {
			return state.deps.map(dep => {
				if (typeof dep === 'string') {
					return dep
				}

				throw new Error('Resource dependency should be a string.')
			})
		}

		return []
	}

	const assertResourceExists = (id: string) => {
		if (!store.has(id)) {
			throw new ResourceNotFound()
		}
	}

	const assertResourceNotExists = (id: string) => {
		if (store.has(id)) {
			throw new Error('Resource already exists.')
		}
	}

	const assertResourceDependenciesExists = (deps: string[]) => {
		for (const dep of deps) {
			if (!store.has(dep)) {
				throw new Error("Resource dependency doesn't exist.")
			}
		}
	}

	const assertNoneDependentResources = (id: string) => {
		for (const deps of store.values()) {
			if (deps.includes(id)) {
				throw new Error('Resource is still in use.')
			}
		}
	}

	const assertInmutableId = (priorState: State, proposedState: State) => {
		if (priorState.id !== proposedState.id) {
			throw new Error('Resource ID cannot be changed.')
		}
	}

	const sleep = (delay: number) => {
		return new Promise(resolve => {
			setTimeout(resolve, delay)
		})
	}

	const store = new Map<string, string[]>()

	return {
		store,
		assertResourceExists,
		assertResourceNotExists,
		provider: createCustomProvider('custom', {
			resource: {
				async getResource(props) {
					const item = parseState(props.state)
					assertResourceExists(item.id)

					const deps = store.get(item.id)

					return {
						id: item.id,
						deps,
					}
				},
				async createResource(props) {
					const item = parseState(props.state)
					assertResourceNotExists(item.id)
					assertResourceDependenciesExists(item.deps)

					await sleep(10)

					store.set(item.id, item.deps)
					return item
				},
				async updateResource(props) {
					const item = parseState(props.proposedState)
					assertResourceExists(item.id)
					assertResourceDependenciesExists(item.deps)
					assertInmutableId(props.priorState, props.proposedState)

					await sleep(10)

					store.set(item.id, item.deps)
					return item
				},
				async deleteResource(props) {
					const item = parseState(props.state)
					assertResourceExists(item.id)
					assertNoneDependentResources(item.id)

					await sleep(10)

					store.delete(item.id)
				},
				async planResourceChange(props) {
					return {
						state: props.proposedState,
						requiresReplacement: config?.requireReplacement ?? false,
					}
				},
			},
		}),
	}
}

export const Resource = createCustomResourceClass<
	{
		id: Input<string>
		update?: OptionalInput<number>
		deps?: OptionalInput<Input<string>[]>
	},
	{
		id: Output<string>
		update: OptionalOutput<number>
		deps: OptionalOutput<string[]>
	}
>('custom', 'resource')

export const createMockWorkSpace = (config?: { hooks?: Hooks; requireReplacement?: boolean }) => {
	const logs: string[] = []
	const stateBackend = new MemoryStateBackend()
	const lockBackend = new MemoryLockBackend()
	const { provider, store, ...rest } = createMockProvider(config)
	const workspace = new WorkSpace({
		hooks: {
			...config?.hooks,
			beforeResourceCreate(event) {
				logs.push(`create:${event.newInput.id}`)
				config?.hooks?.beforeResourceCreate?.(event)
			},
			beforeResourceUpdate(event) {
				logs.push(`update:${event.oldInput.id}`)
				config?.hooks?.beforeResourceUpdate?.(event)
			},
			beforeResourceDelete(event) {
				logs.push(`delete:${event.oldInput.id}`)
				config?.hooks?.beforeResourceDelete?.(event)
			},
		},
		concurrency: 10,
		providers: [provider],
		backend: {
			state: stateBackend,
			lock: lockBackend,
		},
	})

	const reset = () => {
		store.clear()
		stateBackend.clear()
		lockBackend.clear()
	}

	return {
		...rest,
		logs,
		store,
		workspace,
		lockBackend,
		stateBackend,
		reset,
		resetTest() {
			it('reset', () => {
				reset()
			})
		},
		async deploy(cb: (app: App) => void) {
			logs.splice(0, logs.length)

			const app = new App('app')
			cb(app)
			await workspace.deploy(app)
		},
		async delete(cb?: (app: App) => void) {
			logs.splice(0, logs.length)

			const app = new App('app')
			cb?.(app)
			await workspace.delete(app)
		},
	}
}

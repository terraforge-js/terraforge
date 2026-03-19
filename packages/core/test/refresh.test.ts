import {
	App,
	createCustomProvider,
	createCustomResourceClass,
	MemoryLockBackend,
	MemoryStateBackend,
	Stack,
	WorkSpace,
} from '../src'

const Resource = createCustomResourceClass<{ id: string }, { id: string; server?: string }>(
	'refresh-test',
	'resource'
)

describe('refresh', () => {
	it('skips refresh updates when the provider reports the resource as unchanged', async () => {
		const provider = createCustomProvider('refresh-test', {
			resource: {
				async createResource(props) {
					return {
						id: props.state.id as string,
					}
				},
				async refreshResource(props) {
					return {
						kind: 'unchanged' as const,
						state: {
							id: props.priorOutputState.id as string,
							server: 'provider-populated',
						},
					}
				},
			},
		})

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: new MemoryStateBackend(),
				lock: new MemoryLockBackend(),
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		const result = await workspace.refresh(app)
		expect(result).toBeUndefined()
	})

	it('updates only output during refresh commit', async () => {
		const stateBackend = new MemoryStateBackend()
		const provider = createCustomProvider('refresh-test', {
			resource: {
				async createResource(props) {
					return {
						id: props.state.id as string,
					}
				},
				async refreshResource(props) {
					return {
						kind: 'updated' as const,
						state: {
							id: props.priorOutputState.id as string,
							server: 'changed-on-server',
						},
						inputState: {
							id: props.priorInputState.id as string,
							server: 'changed-on-server',
						},
					}
				},
			},
		})

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		const refresh = await workspace.refresh(app)
		expect(refresh?.operations).toHaveLength(1)
		expect(refresh?.operations[0]).toMatchObject({
			operation: 'update',
			before: { id: '1' },
			after: { id: '1', server: 'changed-on-server' },
		})

		for (const operation of refresh?.operations ?? []) {
			operation.commit()
		}

		await refresh?.commit()

		const state = await stateBackend.get(app.urn)
		const node = Object.values(state?.stacks[stack.urn]?.nodes ?? {})[0]

		expect(node?.input).toStrictEqual({ id: '1' })
		expect(node?.output).toStrictEqual({ id: '1', server: 'changed-on-server' })
	})

	it('skips resource refresh when a provider does not implement refreshResource', async () => {
		const provider = createCustomProvider('refresh-test', {
			resource: {
				async createResource(props) {
					return {
						id: props.state.id as string,
					}
				},
			},
		})

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: new MemoryStateBackend(),
				lock: new MemoryLockBackend(),
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		const result = await workspace.refresh(app)
		expect(result).toBeUndefined()
	})
})

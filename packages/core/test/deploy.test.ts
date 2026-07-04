import {
	App,
	createCustomProvider,
	createCustomResourceClass,
	MemoryLockBackend,
	MemoryStateBackend,
	Stack,
	WorkSpace,
} from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('deploy', () => {
	const { workspace, stateBackend, assertResourceExists, assertResourceNotExists } = createMockWorkSpace()

	it('create', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2' })
		new Resource(stack, 'r3', { id: '3' })

		await workspace.deploy(app)

		assertResourceExists('1')
		assertResourceExists('2')
		assertResourceExists('3')
	})

	it('delete', async () => {
		const app = new App('app')

		await workspace.deploy(app)

		assertResourceNotExists('1')
		assertResourceNotExists('2')
		assertResourceNotExists('3')

		const appState = await stateBackend.get(app.urn)

		expect(appState).toBeUndefined()
	})

	it('cross stack dep deploy', async () => {
		const app = new App('app')
		const stack1 = new Stack(app, 'stack-1')
		const stack2 = new Stack(app, 'stack-2')
		const stack3 = new Stack(app, 'stack-3')

		const r1 = new Resource(stack1, 'r1', { id: '1' })
		const r2 = new Resource(stack2, 'r2', { id: '2', deps: [r1.id] })
		new Resource(stack3, 'r3', { id: '3', deps: [r2.id] })

		await workspace.deploy(app)

		assertResourceExists('1')
		assertResourceExists('2')
		assertResourceExists('3')
	})

	it('deletes stale resources from an existing stack during deploy', async () => {
		const {
			workspace,
			stateBackend,
			assertResourceExists,
			assertResourceNotExists,
		} = createMockWorkSpace()
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2' })

		await workspace.deploy(app1)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		new Resource(stack2, 'r1', { id: '1' })

		await workspace.deploy(app2)

		assertResourceExists('1')
		assertResourceNotExists('2')

		const appState = await stateBackend.get(app2.urn)
		expect(appState?.stacks[stack2.urn]?.nodes).toBeDefined()
		expect(Object.keys(appState?.stacks[stack2.urn]?.nodes ?? {})).toHaveLength(1)
		expect(Object.keys(appState?.stacks[stack2.urn]?.nodes ?? {})[0]).toContain('r1')
	})

	it('deletes stale resources from removed stacks during deploy', async () => {
		const {
			workspace,
			stateBackend,
			assertResourceExists,
			assertResourceNotExists,
		} = createMockWorkSpace()
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		const stack2 = new Stack(app1, 'stack-2')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2' })

		await workspace.deploy(app1)

		const app2 = new App('app')
		const nextStack1 = new Stack(app2, 'stack-1')

		new Resource(nextStack1, 'r1', { id: '1' })

		await workspace.deploy(app2)

		assertResourceExists('1')
		assertResourceNotExists('2')

		const appState = await stateBackend.get(app2.urn)
		expect(Object.keys(appState?.stacks ?? {})).toHaveLength(1)
		expect(appState?.stacks[stack2.urn]).toBeUndefined()
	})

	it('repairs drift during deploy when state is marked as drifted', async () => {
		const logs: string[] = []
		const stateBackend = new MemoryStateBackend()
		const lockBackend = new MemoryLockBackend()
		const ResourceWithDrift = createCustomResourceClass<{ id: string }, { id: string; server: string }>(
			'drift-test',
			'resource'
		)

		const provider = createCustomProvider('drift-test', {
			resource: {
				async createResource(props) {
					return {
						id: props.state.id as string,
						server: 'expected',
					}
				},
				async updateResource(props) {
					logs.push(`update:${props.proposedState.id}`)
					return {
						id: props.proposedState.id as string,
						server: 'expected',
					}
				},
			},
		})

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: lockBackend,
			},
		})

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')
		new ResourceWithDrift(stack1, 'r1', { id: '1' })

		await workspace.deploy(app1)

		const stored = await stateBackend.get(app1.urn)
		const node = Object.values(stored?.stacks[stack1.urn]?.nodes ?? {})[0]
		node!.output = {
			id: '1',
			server: 'drifted',
		}
		node!.drifted = true
		await stateBackend.update(app1.urn, stored!)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')
		new ResourceWithDrift(stack2, 'r1', { id: '1' })

		await workspace.deploy(app2)

		expect(logs).toStrictEqual(['update:1'])

		const repaired = await stateBackend.get(app2.urn)
		const repairedNode = Object.values(repaired?.stacks[stack2.urn]?.nodes ?? {})[0]
		expect(repairedNode?.input).toStrictEqual({ id: '1' })
		expect(repairedNode?.output).toStrictEqual({
			id: '1',
			server: 'expected',
		})
		expect(repairedNode?.drifted).toBeUndefined()
	})
})

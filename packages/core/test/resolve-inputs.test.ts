import { App, getMeta, MemoryLockBackend, MemoryStateBackend, Stack, WorkSpace } from '../src'
import { createMockProvider, Resource } from './_mock'

describe('resolve inputs', () => {
	const createWorkSpace = () => {
		const { provider } = createMockProvider()
		const stateBackend = new MemoryStateBackend()
		const workspace = new WorkSpace({
			concurrency: 10,
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		return { workspace, stateBackend }
	}

	it('should not destroy the dependency edges inside the input', async () => {
		const { workspace } = createWorkSpace()

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const r1 = new Resource(stack, 'r1', { id: 'r1' })
		const r2 = new Resource(stack, 'r2', { id: 'r2', deps: [r1.id] })

		const depsBefore = [...getMeta(r2).dependencies]
		expect(depsBefore).toEqual([getMeta(r1).urn])

		await workspace.deploy(app)

		// resolveInputs must not mutate meta.input — the Output instances
		// inside it are the dependency edges for every later deploy.
		expect([...getMeta(r2).dependencies]).toEqual(depsBefore)
	})

	it('should persist dependencies when the same app is deployed twice', async () => {
		const { workspace, stateBackend } = createWorkSpace()

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const r1 = new Resource(stack, 'r1', { id: 'r1' })
		const r2 = new Resource(stack, 'r2', { id: 'r2', deps: [r1.id] })

		await workspace.deploy(app)
		await workspace.deploy(app)

		const appState = (await stateBackend.get(app.urn))!
		const stackState = Object.values(appState.stacks)[0]!
		const r2State = stackState.nodes[getMeta(r2).urn]!

		expect(r2State.dependencies).toEqual([getMeta(r1).urn])
	})
})

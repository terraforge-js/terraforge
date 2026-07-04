import { App, MemoryLockBackend, MemoryStateBackend, Stack, URN, WorkSpace } from '../src'
import { createMockProvider, Resource } from './_mock'

describe('pending deletes and app state deletion', () => {
	it('should not delete the app state while pending deletes remain', async () => {
		const { provider, store } = createMockProvider()
		const stateBackend = new MemoryStateBackend()
		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: 'r1' })

		await workspace.deploy(app)

		// Simulate an orphaned resource from a previous failed
		// createBeforeReplace whose original node/stack is gone.
		store.set('old', [])

		const state = (await stateBackend.get(app.urn))!
		state.pendingDeletes = {
			['urn:app:{app}:stack:{gone}:resource:resource:{old}' as URN]: {
				tag: 'resource',
				type: 'resource',
				provider: 'custom:custom',
				input: { id: 'old' },
				output: { id: 'old' },
				dependencies: [],
			},
		}
		await stateBackend.update(app.urn, state)

		// A filtered delete removes the last stack but must skip the
		// pending delete (its stack is unknown).
		const filtered = new App('app')
		await workspace.delete(filtered, { filters: ['stack'] })

		const afterFiltered = await stateBackend.get(app.urn)

		expect(afterFiltered).toBeDefined()
		expect(afterFiltered?.pendingDeletes).toBeDefined()
		expect(store.has('old')).toBe(true)

		// An unfiltered delete settles the pending delete and can then
		// remove the state file for good.
		const unfiltered = new App('app')
		await workspace.delete(unfiltered)

		expect(await stateBackend.get(app.urn)).toBeUndefined()
		expect(store.has('old')).toBe(false)
	})
})

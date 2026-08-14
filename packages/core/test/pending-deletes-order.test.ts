import { App, MemoryLockBackend, MemoryStateBackend, Stack, URN, WorkSpace } from '../src'
import { createMockProvider, Resource } from './_mock'

describe('pending deletes ordering', () => {
	it('should retry deletes that are blocked by entries queued behind them', async () => {
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

		// Two orphans from previous createBeforeReplace runs where the
		// used resource sits in front of the resource that uses it, so
		// a single in-order pass fails its first delete.
		store.set('old-used', [])
		store.set('old-user', ['old-used'])

		const state = (await stateBackend.get(app.urn))!
		state.pendingDeletes = {
			['urn:app:{app}:stack:{gone}:resource:resource:{old-used}' as URN]: {
				tag: 'resource',
				type: 'resource',
				provider: 'custom:custom',
				input: { id: 'old-used' },
				output: { id: 'old-used' },
				dependencies: [],
			},
			['urn:app:{app}:stack:{gone}:resource:resource:{old-user}' as URN]: {
				tag: 'resource',
				type: 'resource',
				provider: 'custom:custom',
				input: { id: 'old-user' },
				output: { id: 'old-user' },
				dependencies: [],
			},
		}
		await stateBackend.update(app.urn, state)

		const again = new App('app')
		const againStack = new Stack(again, 'stack')
		new Resource(againStack, 'r1', { id: 'r1' })

		await workspace.deploy(again)

		expect(store.has('old-used')).toBe(false)
		expect(store.has('old-user')).toBe(false)
		expect((await stateBackend.get(app.urn))?.pendingDeletes).toBeUndefined()
	})
})

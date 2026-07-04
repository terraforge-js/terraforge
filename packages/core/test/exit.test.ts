import { App, MemoryLockBackend, MemoryStateBackend, Stack, WorkSpace } from '../src'
import { flushExitListeners, onExit, withOnExit } from '../src/workspace/exit'
import { createMockProvider, Resource } from './_mock'

describe('exit listeners', () => {
	it('should flush in reverse registration order', async () => {
		const order: string[] = []

		const releaseA = onExit(async () => {
			order.push('a')
		})
		const releaseB = onExit(async () => {
			order.push('b')
		})
		const releaseC = onExit(async () => {
			order.push('c')
		})

		await flushExitListeners()

		expect(order).toEqual(['c', 'b', 'a'])

		releaseA()
		releaseB()
		releaseC()
	})

	it('withOnExit should release the listener when fn throws', async () => {
		let fired = false

		await expect(
			withOnExit(
				async () => {
					fired = true
				},
				async () => {
					throw new Error('boom')
				}
			)
		).rejects.toThrow('boom')

		await flushExitListeners()

		expect(fired).toBe(false)
	})

	it('a failed deploy should not leak a listener that clobbers newer state', async () => {
		const { provider } = createMockProvider()
		const stateBackend = new MemoryStateBackend()
		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		// Deploy #1 fails graph validation: the filtered-in stack depends
		// on a filtered-out stack that has never been deployed.
		const failing = new App('app')
		const s1 = new Stack(failing, 'stack-1')
		const s2 = new Stack(failing, 'stack-2')
		const r1 = new Resource(s1, 'r1', { id: 'r1' })
		new Resource(s2, 'r2', { id: 'r2', deps: [r1.id] })

		await expect(workspace.deploy(failing, { filters: ['stack-2'] })).rejects.toThrow()

		// Deploy #2 succeeds and persists newer state.
		const working = new App('app')
		const stack = new Stack(working, 'stack-1')
		new Resource(stack, 'r1', { id: 'r1' })

		await workspace.deploy(working)

		const before = JSON.stringify(await stateBackend.get(working.urn))

		// On process exit, a leaked listener from deploy #1 would overwrite
		// the newer state with its stale snapshot.
		await flushExitListeners()

		const after = JSON.stringify(await stateBackend.get(working.urn))

		expect(after).toBe(before)
	})
})

import { App, MemoryLockBackend, MemoryStateBackend, Stack, WorkSpace } from '../src'
import { createMockProvider, Resource } from './_mock'

describe('idempotent token', () => {
	const setup = () => {
		const { provider } = createMockProvider()
		const stateBackend = new MemoryStateBackend()
		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		return { workspace, stateBackend }
	}

	it('should keep the token when the deployment fails and clear it on success', async () => {
		const { workspace, stateBackend } = setup()

		// The dependency doesn't exist, so createResource rejects.
		const failing = new App('app')
		const failingStack = new Stack(failing, 'stack')
		new Resource(failingStack, 'r1', { id: 'r1', deps: ['missing'] })

		await expect(workspace.deploy(failing)).rejects.toThrow('Deploying app failed.')

		const failedState = await stateBackend.get(failing.urn)
		expect(failedState?.idempotentToken).toBeDefined()

		// A retry with a valid config succeeds and clears the token.
		const retry = new App('app')
		const retryStack = new Stack(retry, 'stack')
		new Resource(retryStack, 'r1', { id: 'r1' })

		await workspace.deploy(retry)

		const successState = await stateBackend.get(retry.urn)
		expect(successState?.idempotentToken).toBeUndefined()
	})
})

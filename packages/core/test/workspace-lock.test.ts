import {
	App,
	createCustomProvider,
	createCustomResourceClass,
	LockBackend,
	MemoryLockBackend,
	MemoryStateBackend,
	Stack,
	WorkSpace,
} from '../src'
import { createMockProvider, Resource } from './_mock'

describe('workspace locking', () => {
	it('should report a held lock as already in progress', async () => {
		const { provider } = createMockProvider()
		const lockBackend = new MemoryLockBackend()
		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: new MemoryStateBackend(),
				lock: lockBackend,
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: 'r1' })

		await lockBackend.lock(app.urn)

		await expect(workspace.deploy(app)).rejects.toThrow(`Already in progress: ${app.urn}`)
	})

	it('should surface lock infrastructure errors as themselves', async () => {
		const { provider } = createMockProvider()
		const brokenLock: LockBackend = {
			async lock() {
				throw new Error('network down')
			},
			async locked() {
				return false
			},
			async insecureReleaseLock() {},
		}

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: new MemoryStateBackend(),
				lock: brokenLock,
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: 'r1' })

		await expect(workspace.deploy(app)).rejects.toThrow('network down')
	})
})

describe('refresh lock release', () => {
	const RefreshResource = createCustomResourceClass<{ id: string }, { id: string }>(
		'refresh-lock-test',
		'resource'
	)

	const setup = () => {
		const provider = createCustomProvider('refresh-lock-test', {
			resource: {
				async createResource(props) {
					return { id: props.state.id as string }
				},
				async deleteResource() {},
				async refreshResource(props) {
					return {
						kind: 'updated' as const,
						state: { id: props.priorOutputState.id as string, drift: true },
						inputState: { id: props.priorOutputState.id as string },
					}
				},
			},
		})

		const stateBackend = new MemoryStateBackend()
		let failNextUpdate = false

		const flakyState = new Proxy(stateBackend, {
			get(target, key: string) {
				if (key === 'update') {
					return async (...args: [never, never]) => {
						if (failNextUpdate) {
							failNextUpdate = false
							throw new Error('state write failed')
						}

						return target.update(...args)
					}
				}

				return target[key as keyof typeof target]
			},
		})

		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: flakyState,
				lock: new MemoryLockBackend(),
			},
		})

		return {
			workspace,
			failUpdate() {
				failNextUpdate = true
			},
		}
	}

	const createApp = () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new RefreshResource(stack, 'r1', { id: 'r1' })
		return app
	}

	it('should release the lock when commit fails', async () => {
		const { workspace, failUpdate } = setup()

		await workspace.deploy(createApp())

		const result = await workspace.refresh(createApp())
		expect(result?.operations).toHaveLength(1)

		result?.operations.forEach(op => op.commit())

		failUpdate()
		await expect(result?.commit()).rejects.toThrow('state write failed')

		// The lock must be free again — otherwise this deploy fails
		// with "Already in progress".
		await workspace.deploy(createApp())
	})

	it('should release the lock on discard', async () => {
		const { workspace } = setup()

		await workspace.deploy(createApp())

		const result = await workspace.refresh(createApp())
		expect(result?.operations).toHaveLength(1)

		await result?.discard()

		await workspace.deploy(createApp())
	})
})

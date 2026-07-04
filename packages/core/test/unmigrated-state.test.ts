import { App, getMeta, MemoryLockBackend, MemoryStateBackend, Stack, WorkSpace } from '../src'
import { createMockProvider, Resource } from './_mock'

describe('procedures on unmigrated state', () => {
	const setup = async () => {
		const { provider } = createMockProvider()
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
		const r1 = new Resource(stack, 'r1', { id: 'r1' })

		// A v0 state file: resources under `resources`, no `tag`, no version.
		await stateBackend.update(app.urn, {
			name: 'app',
			stacks: {
				[stack.urn]: {
					name: 'stack',
					dependencies: [],
					resources: {
						[getMeta(r1).urn]: {
							type: 'resource',
							provider: 'custom:custom',
							input: { id: 'r1' },
							output: { id: 'r1' },
							dependencies: [],
						},
					},
				},
			},
		} as never)

		return { workspace, app, r1 }
	}

	it('hydrate should migrate a v0 state before reading it', async () => {
		const { workspace, app, r1 } = await setup()

		await workspace.hydrate(app)

		expect(await r1.id).toBe('r1')
	})

	it('status should migrate a v0 state before reading it', async () => {
		const { workspace, app } = await setup()

		const stacks = await workspace.status(app)

		expect(stacks).toHaveLength(1)
	})

	it('refresh should migrate a v0 state before reading it', async () => {
		const { workspace, app } = await setup()

		await workspace.refresh(app)
	})
})

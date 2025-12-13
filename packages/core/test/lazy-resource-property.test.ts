import { App, getMeta, Output, Stack } from '@terraforge/core'
import { createMockWorkSpace, Resource } from './_mock'

describe('Lazy resource property', () => {
	const { workspace, stateBackend } = createMockWorkSpace()

	it('should link dependencies for lazy resource properties', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const deps: Output<string>[] = []
		const r1 = new Resource(stack, 'r1', { id: '1', deps })
		const r2 = new Resource(stack, 'r2', { id: '2' })
		deps.push(r2.id)

		getMeta(r1)

		await workspace.deploy(app)

		const appState = await stateBackend.get(app.urn)

		expect(appState).toStrictEqual({
			name: app.name,
			version: expect.any(Number),
			stacks: {
				[stack.urn]: {
					name: stack.name,
					nodes: {
						[getMeta(r1).urn]: expect.objectContaining({ tag: 'resource' }),
						[getMeta(r2).urn]: expect.objectContaining({ tag: 'resource' }),
					},
				},
			},
		})
	})
})

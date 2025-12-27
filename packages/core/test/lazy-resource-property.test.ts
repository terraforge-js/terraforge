import { App, Output, Stack } from '@terraforge/core'
import { createMockWorkSpace, Resource } from './_mock'

describe('Lazy resource property', () => {
	const { workspace, stateBackend } = createMockWorkSpace()

	it('should link dependencies for lazy resource properties', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const deps: Output<string>[] = []
		const r1 = new Resource(stack, 'r1', { id: '1', deps })
		const r2 = new Resource(stack, 'r2', { id: '2' })

		// Add the dependency after we created the resource
		deps.push(r2.id)

		await workspace.deploy(app)

		const appState = await stateBackend.get(app.urn)

		expect(appState).toStrictEqual({
			name: app.name,
			version: expect.any(Number),
			stacks: {
				[stack.urn]: {
					name: stack.name,
					nodes: {
						[r1.urn]: expect.objectContaining({
							tag: 'resource',
							dependencies: ['urn:app:{app}:stack:{stack}:resource:resource:{r2}'],
						}),
						[r2.urn]: expect.objectContaining({
							tag: 'resource',
						}),
					},
				},
			},
		})
	})
})

import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('filters', () => {
	const { workspace, assertResourceExists, assertResourceNotExists, reset } = createMockWorkSpace()

	it('should only deploy stacks that are filtered', async () => {
		const app = new App('app')
		const stack1 = new Stack(app, 'stack-1')
		new Resource(stack1, 'r1', { id: '1' })

		const stack2 = new Stack(app, 'stack-2')
		new Resource(stack2, 'r2', { id: '2' })

		const stack3 = new Stack(app, 'stack-3')
		new Resource(stack3, 'r3', { id: '3' })

		await workspace.deploy(app, { filters: ['stack-1', 'stack-2'] })

		assertResourceExists('1')
		assertResourceExists('2')
		assertResourceNotExists('3')
	})

	it('should only delete stacks that are filtered', async () => {
		const app = new App('app')

		await workspace.delete(app, { filters: ['stack-2'] })

		assertResourceExists('1')
		assertResourceNotExists('2')
		assertResourceNotExists('3')
	})

	it('should throw on deploying stacks with unresolved dependencies', async () => {
		reset()

		const app = new App('app')
		const stack1 = new Stack(app, 'stack-1')
		const r1 = new Resource(stack1, 'r1', { id: '1' })

		const stack2 = new Stack(app, 'stack-2')
		new Resource(stack2, 'r2', { id: '2', deps: [r1.id] })

		await expect(workspace.deploy(app, { filters: ['stack-2'] })).rejects.toThrowError()
	})

	it('should delete removed stacks even when deploying with filters', async () => {
		reset()

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		const stack2 = new Stack(app1, 'feature-1')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2' })

		await workspace.deploy(app1)

		const app2 = new App('app')
		const nextStack1 = new Stack(app2, 'stack-1')
		new Resource(nextStack1, 'r1', { id: '1' })

		await workspace.deploy(app2, { filters: ['stack-1'] })

		assertResourceExists('1')
		assertResourceNotExists('2')
	})
})

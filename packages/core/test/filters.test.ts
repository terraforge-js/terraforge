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

	it('should not update resources from unfiltered stacks during deploy', async () => {
		const { workspace, logs, assertResourceExists } = createMockWorkSpace()

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		new Resource(stack1, 'r1', { id: '1', update: 0 })

		const stack2 = new Stack(app1, 'stack-2')
		new Resource(stack2, 'r2', { id: '2', update: 0 })

		await workspace.deploy(app1)

		logs.splice(0, logs.length)

		const app2 = new App('app')
		const nextStack1 = new Stack(app2, 'stack-1')
		new Resource(nextStack1, 'r1', { id: '1', update: 1 })

		const nextStack2 = new Stack(app2, 'stack-2')
		new Resource(nextStack2, 'r2', { id: '2', update: 1 })

		await workspace.deploy(app2, { filters: ['stack-1'] })

		expect(logs).toContain('update:1')
		expect(logs).not.toContain('update:2')
		expect(logs).not.toContain('delete:2')
		assertResourceExists('1')
		assertResourceExists('2')
	})

	it('should not delete resources from unfiltered stacks during delete', async () => {
		const { workspace, logs, assertResourceExists, assertResourceNotExists } = createMockWorkSpace()

		const app = new App('app')
		const stack1 = new Stack(app, 'stack-1')
		new Resource(stack1, 'r1', { id: '1' })

		const stack2 = new Stack(app, 'stack-2')
		new Resource(stack2, 'r2', { id: '2' })

		await workspace.deploy(app)

		logs.splice(0, logs.length)

		await workspace.delete(app, { filters: ['stack-1'] })

		expect(logs).toContain('delete:1')
		expect(logs).not.toContain('delete:2')
		assertResourceNotExists('1')
		assertResourceExists('2')
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

	it('should not delete removed stacks that are outside the deploy filter', async () => {
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
		assertResourceExists('2')
	})

	it('should not process pending deletes from unfiltered stacks during deploy', async () => {
		const { workspace, stateBackend, store, logs } = createMockWorkSpace()

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		new Resource(stack1, 'r1', { id: 'stack-1', update: 0 })

		const stack2 = new Stack(app1, 'stack-2')
		const stack2r1v1 = new Resource(stack2, 'r1', { id: 'stack-2-old' })
		new Resource(stack2, 'r2', { id: 'stack-2-dep', deps: [stack2r1v1.id] })

		await workspace.deploy(app1)

		logs.splice(0, logs.length)

		const app2 = new App('app')
		const nextStack1 = new Stack(app2, 'stack-1')
		new Resource(nextStack1, 'r1', { id: 'stack-1', update: 1 })

		const nextStack2 = new Stack(app2, 'stack-2')
		const stack2r1v2 = new Resource(
			nextStack2,
			'r1',
			{ id: 'stack-2-new' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(nextStack2, 'r2', { id: 'stack-2-dep', deps: [stack2r1v2.id] })

		store.delete('stack-2-dep')

		await expect(workspace.deploy(app2)).rejects.toThrowError()

		const failedState = await stateBackend.get(app2.urn)
		expect(failedState?.pendingDeletes).toBeDefined()
		expect(store.has('stack-2-old')).toBe(true)

		store.set('stack-2-dep', ['stack-2-new'])
		logs.splice(0, logs.length)

		const app3 = new App('app')
		const finalStack1 = new Stack(app3, 'stack-1')
		new Resource(finalStack1, 'r1', { id: 'stack-1', update: 2 })

		const finalStack2 = new Stack(app3, 'stack-2')
		const stack2r1v3 = new Resource(
			finalStack2,
			'r1',
			{ id: 'stack-2-new' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(finalStack2, 'r2', { id: 'stack-2-dep', deps: [stack2r1v3.id] })

		await workspace.deploy(app3, { filters: ['stack-1'] })

		expect(logs).toContain('update:stack-1')
		expect(logs).not.toContain('delete:stack-2-old')
		expect(store.has('stack-2-old')).toBe(true)

		const filteredState = await stateBackend.get(app3.urn)
		expect(filteredState?.pendingDeletes).toBeDefined()
		expect(Object.keys(filteredState?.pendingDeletes ?? {})).toHaveLength(1)
	})

	it('should not process pending deletes from unfiltered stacks during delete', async () => {
		const { workspace, stateBackend, store, logs } = createMockWorkSpace()

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		new Resource(stack1, 'r1', { id: 'stack-1' })

		const stack2 = new Stack(app1, 'stack-2')
		const stack2r1v1 = new Resource(stack2, 'r1', { id: 'stack-2-old' })
		new Resource(stack2, 'r2', { id: 'stack-2-dep', deps: [stack2r1v1.id] })

		await workspace.deploy(app1)

		const app2 = new App('app')
		const nextStack1 = new Stack(app2, 'stack-1')
		new Resource(nextStack1, 'r1', { id: 'stack-1' })

		const nextStack2 = new Stack(app2, 'stack-2')
		const stack2r1v2 = new Resource(
			nextStack2,
			'r1',
			{ id: 'stack-2-new' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(nextStack2, 'r2', { id: 'stack-2-dep', deps: [stack2r1v2.id] })

		store.delete('stack-2-dep')

		await expect(workspace.deploy(app2)).rejects.toThrowError()

		logs.splice(0, logs.length)

		const app3 = new App('app')
		await workspace.delete(app3, { filters: ['stack-1'] })

		expect(logs).toContain('delete:stack-1')
		expect(logs).not.toContain('delete:stack-2-old')
		expect(store.has('stack-1')).toBe(false)
		expect(store.has('stack-2-old')).toBe(true)

		const filteredState = await stateBackend.get(app3.urn)
		expect(filteredState?.pendingDeletes).toBeDefined()
		expect(Object.keys(filteredState?.pendingDeletes ?? {})).toHaveLength(1)
	})
})

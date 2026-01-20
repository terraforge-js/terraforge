import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('status', () => {
	const { workspace, reset } = createMockWorkSpace()

	beforeEach(() => {
		reset()
	})

	it('should return pending for resources not yet deployed', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2' })

		const status = await workspace.status(app)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('pending')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('pending')
	})

	it('should return created for deployed resources with unchanged config', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2' })

		await workspace.deploy(app)

		const status = await workspace.status(app)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('created')
	})

	it('should return changed for deployed resources with modified config', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		new Resource(stack1, 'r1', { id: '1', update: 1 })

		await workspace.deploy(app1)

		// Create new app with changed config
		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		new Resource(stack2, 'r1', { id: '1', update: 2 })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(1)
		expect(status[0]?.status).toBe('changed')
	})

	it('should return stale for resources removed from config', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2' })

		await workspace.deploy(app1)

		// Create new app with r2 removed
		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		new Resource(stack2, 'r1', { id: '1' })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('stale')
	})

	it('should return stale for resources in removed stacks', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack-1')
		const stack2 = new Stack(app1, 'stack-2')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2' })

		await workspace.deploy(app1)

		// Create new app with stack-2 removed
		const app2 = new App('app')
		const newStack1 = new Stack(app2, 'stack-1')

		new Resource(newStack1, 'r1', { id: '1' })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('stale')
	})

	it('should return empty array for empty app with no state', async () => {
		const app = new App('app')

		const status = await workspace.status(app)

		expect(status).toHaveLength(0)
	})

	it('should handle mixed statuses', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2', update: 1 })

		await workspace.deploy(app1)

		// Create new app with:
		// - r1 unchanged (created)
		// - r2 changed (changed)
		// - r3 new (pending)
		// - r1 from state removed would be stale, but we keep r1
		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		new Resource(stack2, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2', update: 2 })
		new Resource(stack2, 'r3', { id: '3' })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(3)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('changed')
		expect(status.find(r => r.urn.includes('r3'))?.status).toBe('pending')
	})

	it('should return created for deployed resources with dependencies', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const r1 = new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app)

		const status = await workspace.status(app)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('created')
	})

	it('should return created for unchanged dependent resources after redeploy', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		const r1 = new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app1)

		// Create same app again (simulating a new run with same config)
		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		const r1b = new Resource(stack2, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2', deps: [r1b.id] })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('created')
	})

	it('should return created for chained dependencies', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const r1 = new Resource(stack, 'r1', { id: '1' })
		const r2 = new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		new Resource(stack, 'r3', { id: '3', deps: [r2.id] })

		await workspace.deploy(app)

		const status = await workspace.status(app)

		expect(status).toHaveLength(3)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r3'))?.status).toBe('created')
	})

	it('should return created for cross-stack dependencies', async () => {
		const app = new App('app')
		const stack1 = new Stack(app, 'stack-1')
		const stack2 = new Stack(app, 'stack-2')

		const r1 = new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app)

		const status = await workspace.status(app)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('created')
	})

	it('should detect changed on dependent resource when static input changes', async () => {
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')

		const r1 = new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2', update: 1, deps: [r1.id] })

		await workspace.deploy(app1)

		// Change the static 'update' field on r2
		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')

		const r1b = new Resource(stack2, 'r1', { id: '1' })
		new Resource(stack2, 'r2', { id: '2', update: 2, deps: [r1b.id] })

		const status = await workspace.status(app2)

		expect(status).toHaveLength(2)
		expect(status.find(r => r.urn.includes('r1'))?.status).toBe('created')
		expect(status.find(r => r.urn.includes('r2'))?.status).toBe('changed')
	})
})

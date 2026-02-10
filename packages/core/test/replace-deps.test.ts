import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('replace with dependencies', () => {
	it('replace resources that are dependents on a replacing resource', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: true })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '3' }, { replaceOnChanges: ['id'] })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] }, { replaceOnChanges: ['deps'] })
		})

		expect(logs).toStrictEqual(['delete:2', 'delete:1', 'create:3', 'create:2'])
	})

	it('replacing dependent resources should fail if they are not marked for replacement', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: true })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await expect(
			deploy(app => {
				const stack = new Stack(app, 'stack')
				const r1 = new Resource(stack, 'r1', { id: '3' }, { replaceOnChanges: ['id'] })
				new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
			})
		).rejects.toThrowError()

		expect(logs).toStrictEqual([])
	})

	it('createBeforeReplace should fail early if dependent is not marked for replacement', async () => {
		const { logs, deploy, store } = createMockWorkSpace({ requireReplacement: true })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await expect(
			deploy(app => {
				const stack = new Stack(app, 'stack')
				const r1 = new Resource(
					stack,
					'r1',
					{ id: '3' },
					{
						replaceOnChanges: ['id'],
						createBeforeReplace: true,
					}
				)
				new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
			})
		).rejects.toThrowError()

		// Should fail before creating the new resource
		expect(logs).toStrictEqual([])
		expect(store.has('1')).toBe(true) // Old r1 still exists
		expect(store.has('3')).toBe(false) // New r1 was never created
	})

	it('detach/reattach the dependency link of resources that are dependents on a replacing resource', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: false })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '3' }, { replaceOnChanges: ['id'] })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['update:2', 'delete:1', 'create:3', 'update:2'])
	})

	it('create before replace & replace dependent', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: true })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(
				stack,
				'r1',
				{ id: '3' },
				{
					replaceOnChanges: ['id'],
					createBeforeReplace: true,
				}
			)
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] }, { replaceOnChanges: ['deps'] })
		})

		expect(logs).toStrictEqual(['create:3', 'delete:2', 'create:2', 'delete:1'])
	})

	it('create before replace & detach/reattach dependency link', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: false })

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])

		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(
				stack,
				'r1',
				{ id: '3' },
				{
					replaceOnChanges: ['id'],
					createBeforeReplace: true,
				}
			)
			new Resource(stack, 'r2', { id: '2', deps: [r1.id] })
		})

		expect(logs).toStrictEqual(['create:3', 'update:2', 'delete:1'])
	})

	it('createBeforeReplace persists pending delete when dependent fails', async () => {
		const { logs, workspace, stateBackend, store } = createMockWorkSpace({ requireReplacement: false })

		// Step 1: Create r1 and r2 where r2 depends on r1
		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')
		const r1_1 = new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2', deps: [r1_1.id] })

		await workspace.deploy(app1)
		expect(logs).toStrictEqual(['create:1', 'create:2'])

		// Step 2: Replace r1 with createBeforeReplace, but make r2 update fail
		logs.splice(0, logs.length)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')
		const r1_2 = new Resource(
			stack2,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(stack2, 'r2', { id: '2', deps: [r1_2.id] })

		// Make r2 update fail by removing its resource from the store
		store.delete('2')

		await expect(workspace.deploy(app2)).rejects.toThrowError()

		// The new r1 (id:3) was created, but old r1 (id:1) should be in pendingDeletes
		expect(logs).toStrictEqual(['create:3', 'update:2'])
		expect(store.has('1')).toBe(true) // Old r1 still exists in cloud
		expect(store.has('3')).toBe(true) // New r1 was created

		// Check that pendingDeletes is persisted in state
		const state = await stateBackend.get(app2.urn)
		expect(state?.pendingDeletes).toBeDefined()
		expect(Object.keys(state!.pendingDeletes!)).toHaveLength(1)

		// Step 3: Fix the store and deploy again - pending delete should be processed
		logs.splice(0, logs.length)
		store.set('2', ['3']) // Restore r2 pointing to new r1

		const app3 = new App('app')
		const stack3 = new Stack(app3, 'stack')
		const r1_3 = new Resource(
			stack3,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(stack3, 'r2', { id: '2', deps: [r1_3.id] })

		await workspace.deploy(app3)

		// The old r1 (id:1) should now be deleted via pendingDeletes
		// r2 also gets updated because its state was out of sync
		expect(logs).toStrictEqual(['update:2', 'delete:1'])
		expect(store.has('1')).toBe(false) // Old r1 is now deleted
		expect(store.has('3')).toBe(true) // New r1 still exists

		// pendingDeletes should be cleaned up
		const finalState = await stateBackend.get(app3.urn)
		expect(finalState?.pendingDeletes).toBeUndefined()
	})
})

import { App, MemoryLockBackend, MemoryStateBackend, Stack, WorkSpace, type Provider } from '../src'
import { createMockProvider, createMockWorkSpace, Resource } from './_mock'

const createWorkspaceWithProvider = (provider: Provider) => {
	const logs: string[] = []
	const stateBackend = new MemoryStateBackend()
	const lockBackend = new MemoryLockBackend()
	const workspace = new WorkSpace({
		concurrency: 1,
		providers: [provider],
		backend: {
			state: stateBackend,
			lock: lockBackend,
		},
		hooks: {
			beforeResourceCreate(event) {
				logs.push(`create:${event.newInput.id}`)
			},
			beforeResourceUpdate(event) {
				logs.push(`update:${event.oldInput.id}`)
			},
			beforeResourceDelete(event) {
				logs.push(`delete:${event.oldInput.id}`)
			},
		},
	})

	return {
		logs,
		stateBackend,
		workspace,
	}
}

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

	it('createBeforeReplace should keep the old resource when the replacement create fails', async () => {
		const { provider, store } = createMockProvider()
		const createResource = provider.createResource.bind(provider)
		provider.createResource = async props => {
			if ((props.state as { id: string }).id === '3') {
				throw new Error('create failed')
			}

			return createResource(props)
		}

		const { logs, workspace, stateBackend } = createWorkspaceWithProvider(provider)

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')
		new Resource(stack1, 'r1', { id: '1' })

		await workspace.deploy(app1)
		expect(logs).toStrictEqual(['create:1'])

		logs.splice(0, logs.length)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')
		new Resource(
			stack2,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)

		await expect(workspace.deploy(app2)).rejects.toThrowError('Deploying app failed.')

		expect(logs).toStrictEqual(['create:3'])
		expect(store.has('1')).toBe(true)
		expect(store.has('3')).toBe(false)

		const state = await stateBackend.get(app2.urn)
		expect(state?.pendingDeletes).toBeUndefined()
	})

	it('createBeforeReplace with retainOnDelete should keep the old resource without pending delete state', async () => {
		const { logs, workspace, stateBackend, store } = createMockWorkSpace({ requireReplacement: false })

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')
		new Resource(
			stack1,
			'r1',
			{ id: '1' },
			{
				retainOnDelete: true,
			}
		)

		await workspace.deploy(app1)
		expect(logs).toStrictEqual(['create:1'])

		logs.splice(0, logs.length)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')
		new Resource(
			stack2,
			'r1',
			{ id: '3' },
			{
				retainOnDelete: true,
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)

		await workspace.deploy(app2)

		expect(logs).toStrictEqual(['create:3'])
		expect(store.has('1')).toBe(true)
		expect(store.has('3')).toBe(true)

		const state = await stateBackend.get(app2.urn)
		expect(state?.pendingDeletes).toBeUndefined()
	})

	it('createBeforeReplace should handle mixed dependent update and replacement flows', async () => {
		const { provider, store } = createMockProvider()
		provider.planResourceChange = async props => {
			const priorState = props.priorState as { id: string; deps?: string[] }
			const proposedState = props.proposedState as { id: string; deps?: string[] }

			if ((priorState.id === '2' || priorState.id === '4') && proposedState.id !== priorState.id) {
				throw new Error(`unexpected proposed state for dependent ${priorState.id}`)
			}

			const priorDeps = priorState.deps ?? []
			const proposedDeps = proposedState.deps ?? []
			const depsChanged =
				priorDeps.length !== proposedDeps.length ||
				priorDeps.some((value, index) => proposedDeps[index] !== value)

			return {
				version: 1,
				state: props.proposedState,
				requiresReplacement: priorState.id === '2' && depsChanged,
			}
		}

		const { logs, workspace } = createWorkspaceWithProvider(provider)

		const app1 = new App('app')
		const stack1 = new Stack(app1, 'stack')
		const r1a = new Resource(stack1, 'r1', { id: '1' })
		new Resource(stack1, 'r2', { id: '2', deps: [r1a.id] }, { replaceOnChanges: ['deps'] })
		new Resource(stack1, 'r3', { id: '4', deps: [r1a.id] })

		await workspace.deploy(app1)
		expect(logs).toStrictEqual(['create:1', 'create:2', 'create:4'])

		logs.splice(0, logs.length)

		const app2 = new App('app')
		const stack2 = new Stack(app2, 'stack')
		const r1b = new Resource(
			stack2,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
				createBeforeReplace: true,
			}
		)
		new Resource(stack2, 'r2', { id: '2', deps: [r1b.id] }, { replaceOnChanges: ['deps'] })
		new Resource(stack2, 'r3', { id: '4', deps: [r1b.id] })

		await workspace.deploy(app2)

		expect(logs).toStrictEqual(['create:3', 'delete:2', 'create:2', 'update:4', 'delete:1'])
		expect(store.has('1')).toBe(false)
		expect(store.has('2')).toBe(true)
		expect(store.get('2')).toStrictEqual(['3'])
		expect(store.get('4')).toStrictEqual(['3'])
	})
})

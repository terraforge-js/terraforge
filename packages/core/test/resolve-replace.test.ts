import { Stack } from '../src'
import { resolve } from '../src/output'
import { createMockWorkSpace, Resource } from './_mock'

describe('$resolve with replacement', () => {
	it('should resolve new values after createBeforeReplace', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: false })

		let resolvedValue1: string | undefined
		let resolvedValue2: string | undefined

		// First deployment
		await deploy(app => {
			const stack = new Stack(app, 'stack')
			const r1 = new Resource(stack, 'r1', { id: '1' })
			new Resource(stack, 'r2', {
				id: '2',
				// Use deps: [r1.id] to satisfy the mock provider's dependency check
				deps: [r1.id],
				// Also test $resolve separately by storing the resolved value
				update: resolve([r1.id], r1Id => {
					resolvedValue1 = `transformed:${r1Id}`
					return 1
				}),
			})
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])
		expect(resolvedValue1).toBe('transformed:1')

		// Second deployment - r1 is replaced with createBeforeReplace
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
			new Resource(stack, 'r2', {
				id: '2',
				deps: [r1.id],
				update: resolve([r1.id], r1Id => {
					resolvedValue2 = `transformed:${r1Id}`
					return 2
				}),
			})
		})

		expect(logs).toStrictEqual(['create:3', 'update:2', 'delete:1'])
		// This is the key assertion - resolvedValue2 should have the NEW r1 id
		expect(resolvedValue2).toBe('transformed:3')
	})

	it('should resolve new values after createBeforeReplace across stacks', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: false })

		let resolvedValue1: string | undefined
		let resolvedValue2: string | undefined

		// First deployment - resources in different stacks
		await deploy(app => {
			const stack1 = new Stack(app, 'stack1')
			const stack2 = new Stack(app, 'stack2')

			// r1 is in stack1
			const r1 = new Resource(stack1, 'r1', { id: '1' })

			// r2 is in stack2 but depends on r1
			new Resource(stack2, 'r2', {
				id: '2',
				deps: [r1.id],
				update: resolve([r1.id], r1Id => {
					resolvedValue1 = `transformed:${r1Id}`
					return 1
				}),
			})
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])
		expect(resolvedValue1).toBe('transformed:1')

		// Second deployment - r1 is replaced with createBeforeReplace
		await deploy(app => {
			const stack1 = new Stack(app, 'stack1')
			const stack2 = new Stack(app, 'stack2')

			const r1 = new Resource(
				stack1,
				'r1',
				{ id: '3' },
				{
					replaceOnChanges: ['id'],
					createBeforeReplace: true,
				}
			)

			new Resource(stack2, 'r2', {
				id: '2',
				deps: [r1.id],
				update: resolve([r1.id], r1Id => {
					resolvedValue2 = `transformed:${r1Id}`
					return 2
				}),
			})
		})

		expect(logs).toStrictEqual(['create:3', 'update:2', 'delete:1'])
		expect(resolvedValue2).toBe('transformed:3')
	})

	it('should resolve new values after replace (non-createBeforeReplace) across stacks', async () => {
		const { logs, deploy } = createMockWorkSpace({ requireReplacement: false })

		let resolvedValue1: string | undefined
		let resolvedValue2: string | undefined

		// First deployment - resources in different stacks
		await deploy(app => {
			const stack1 = new Stack(app, 'stack1')
			const stack2 = new Stack(app, 'stack2')

			// r1 is in stack1 (distribution)
			const r1 = new Resource(stack1, 'r1', { id: '1' })

			// r2 is in stack2 but depends on r1 (bucket policy)
			new Resource(stack2, 'r2', {
				id: '2',
				deps: [r1.id],
				update: resolve([r1.id], r1Id => {
					resolvedValue1 = `transformed:${r1Id}`
					return 1
				}),
			})
		})

		expect(logs).toStrictEqual(['create:1', 'create:2'])
		expect(resolvedValue1).toBe('transformed:1')

		// Second deployment - r1 is replaced WITHOUT createBeforeReplace
		await deploy(app => {
			const stack1 = new Stack(app, 'stack1')
			const stack2 = new Stack(app, 'stack2')

			const r1 = new Resource(
				stack1,
				'r1',
				{ id: '3' },
				{
					replaceOnChanges: ['id'],
					// NO createBeforeReplace - this triggers detach/reattach flow
				}
			)

			new Resource(stack2, 'r2', {
				id: '2',
				deps: [r1.id],
				update: resolve([r1.id], r1Id => {
					resolvedValue2 = `transformed:${r1Id}`
					return 2
				}),
			})
		})

		// With non-createBeforeReplace, the flow is:
		// 1. update:2 (detach - deps removed)
		// 2. delete:1 (old r1 deleted)
		// 3. create:3 (new r1 created)
		// 4. update:2 (reattach - deps restored with new value)
		expect(logs).toStrictEqual(['update:2', 'delete:1', 'create:3', 'update:2'])
		expect(resolvedValue2).toBe('transformed:3')
	})
})

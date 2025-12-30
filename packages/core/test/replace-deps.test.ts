import { Stack } from '../src'
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
})

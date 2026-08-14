import { Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('create-before-replace pre-flight', () => {
	it('falls back to the replacement annotations when planning a dependent fails', async () => {
		const { logs, deploy } = createMockWorkSpace({ planError: true })

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

		// The un-plannable dependent counts as requiring replacement &
		// its annotations cover the dependency, so the deploy proceeds:
		// new resource first, the old one deletes at the very end.
		expect(logs).toStrictEqual(['create:3', 'delete:2', 'create:2', 'delete:1'])
	})

	it('still rejects an un-plannable dependent without replacement annotations', async () => {
		const { logs, deploy, store } = createMockWorkSpace({ planError: true })

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
		expect(store.has('1')).toBe(true)
		expect(store.has('3')).toBe(false)
	})
})

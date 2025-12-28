import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('replacement ordering', () => {
	it('recreates dependents around a dependency replacement', async () => {
		const events: string[] = []
		let secondDeploy = false

		const { workspace } = createMockWorkSpace({
			beforeResourceDelete: event => {
				if (!secondDeploy) return
				events.push(`delete:${event.oldOutput.id}`)
			},
			beforeResourceCreate: event => {
				if (!secondDeploy) return
				events.push(`create:${event.newInput.id}`)
			},
			beforeResourceUpdate(event) {
				if (!secondDeploy) return
				events.push(`update:${event.newInput.id}`)
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const r1 = new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app)

		const nextApp = new App('app')
		const nextStack = new Stack(nextApp, 'stack')
		const nextR1 = new Resource(
			nextStack,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
			}
		)
		new Resource(nextStack, 'r2', { id: '2', deps: [nextR1.id] })

		secondDeploy = true
		await workspace.deploy(nextApp)

		expect(events).toEqual(['delete:2', 'create:3', 'delete:1', 'create:2'])
	})

	it('updates dependents before deleting replaced dependency', async () => {
		const { workspace, store } = createMockWorkSpace({
			beforeResourceDelete: event => {
				if (event.oldOutput.id === '1') {
					for (const deps of store.values()) {
						expect(deps.includes('1')).toBe(false)
					}
				}
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const r1 = new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app)

		const nextApp = new App('app')
		const nextStack = new Stack(nextApp, 'stack')
		const nextR1 = new Resource(
			nextStack,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
			}
		)
		new Resource(nextStack, 'r2', { id: '2', deps: [nextR1.id] })

		await workspace.deploy(nextApp)
	})

	it('updates a dependent to break the dependency before replacement delete', async () => {
		const events: string[] = []
		let secondDeploy = false

		const { workspace } = createMockWorkSpace({
			beforeResourceCreate: event => {
				if (!secondDeploy) return
				events.push(`create:${event.newInput.id}`)
				// if (event.resource.urn.includes('{r2}')) {
				// }
			},
			beforeResourceUpdate: event => {
				if (!secondDeploy) return
				events.push(`update:${event.oldInput.id}`)
				// if (event.resource.urn.includes('{r2}')) {
				// }
			},
			beforeResourceDelete: event => {
				if (!secondDeploy) return
				events.push(`delete:${event.oldInput.id}`)
				// if (event.oldOutput.id === '1') {
				// 	events.push('delete:1')
				// }
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const r1 = new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2', deps: [r1.id] })

		await workspace.deploy(app)

		const nextApp = new App('app')
		const nextStack = new Stack(nextApp, 'stack')
		const nextR1 = new Resource(
			nextStack,
			'r1',
			{ id: '3' },
			{
				replaceOnChanges: ['id'],
			}
		)
		// r2 remains but no longer depends on r1.
		new Resource(nextStack, 'r2', { id: '2', deps: [nextR1.id] })

		secondDeploy = true
		await workspace.deploy(nextApp)

		expect(events).toEqual(['create:3', 'update:2', 'delete:1'])
	})
})

import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

const getStateId = (state: Record<string, unknown>) => {
	if (typeof state.id !== 'string') {
		throw new Error('State id is missing.')
	}

	return state.id
}

describe('hooks', () => {
	it('runs create hooks with expected payload', async () => {
		const events: string[] = []

		const { workspace, assertResourceExists, assertResourceNotExists } = createMockWorkSpace({
			beforeResourceCreate: event => {
				events.push('before-create')
				assertResourceNotExists(getStateId(event.newInput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: '1' },
				})
			},
			afterResourceCreate: event => {
				events.push('after-create')
				assertResourceExists(getStateId(event.newOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: '1' },
					newOutput: { id: '1', deps: [] },
				})
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		expect(events).toStrictEqual(['before-create', 'after-create'])
	})

	it('runs update hooks with expected payload', async () => {
		const events: string[] = []

		const { workspace } = createMockWorkSpace({
			beforeResourceUpdate: event => {
				events.push('before-update')
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: '1', update: 1 },
					oldInput: { id: '1', update: 0 },
					oldOutput: { id: '1', deps: [] },
				})
			},
			afterResourceUpdate: event => {
				events.push('after-update')
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: '1', update: 1 },
					newOutput: { id: '1', deps: [] },
					oldInput: { id: '1', update: 0 },
					oldOutput: { id: '1', deps: [] },
				})
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(stack, 'r1', { id: '1', update: 0 })

		await workspace.deploy(app)

		expect(events).toStrictEqual([])

		const nextApp = new App('app')
		const nextStack = new Stack(nextApp, 'stack')

		new Resource(nextStack, 'r1', { id: '1', update: 1 })

		await workspace.deploy(nextApp)

		expect(events).toStrictEqual(['before-update', 'after-update'])
	})

	it('runs delete hooks with expected payload', async () => {
		const events: string[] = []

		const { workspace, assertResourceExists, assertResourceNotExists } = createMockWorkSpace({
			beforeResourceDelete: event => {
				events.push('before-delete')
				assertResourceExists(getStateId(event.oldOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					oldInput: { id: '1' },
					oldOutput: { id: '1', deps: [] },
				})
			},
			afterResourceDelete: event => {
				events.push('after-delete')
				assertResourceNotExists(getStateId(event.oldOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					oldInput: { id: '1' },
					oldOutput: { id: '1', deps: [] },
				})
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		const deleteApp = new App('app')
		await workspace.delete(deleteApp)

		expect(events).toStrictEqual(['before-delete', 'after-delete'])
	})

	it('runs replace hooks in order with expected payload', async () => {
		const events: string[] = []

		const { workspace, assertResourceExists, assertResourceNotExists } = createMockWorkSpace({
			beforeResourceDelete: event => {
				events.push('before-delete')
				assertResourceExists(getStateId(event.oldOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					oldInput: { id: '1' },
					oldOutput: { id: '1', deps: [] },
				})
			},
			afterResourceDelete: event => {
				events.push('after-delete')
				assertResourceNotExists(getStateId(event.oldOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					oldInput: { id: '1' },
					oldOutput: { id: '1', deps: [] },
				})
			},
			beforeResourceCreate: event => {
				events.push('before-create')
				assertResourceNotExists(getStateId(event.newInput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: expect.any(String) },
				})
			},
			afterResourceCreate: event => {
				events.push('after-create')
				assertResourceExists(getStateId(event.newOutput))
				expect(event).toStrictEqual({
					urn: expect.any(String),
					type: 'resource',
					resource: expect.any(Object),
					newInput: { id: expect.any(String) },
					newOutput: { id: expect.any(String), deps: [] },
				})
			},
		})

		const app = new App('app')
		const stack = new Stack(app, 'stack')
		new Resource(
			stack,
			'r1',
			{ id: '1' },
			{
				replaceOnChanges: ['id'],
			}
		)

		await workspace.deploy(app)

		const nextApp = new App('app')
		const nextStack = new Stack(nextApp, 'stack')

		new Resource(
			nextStack,
			'r1',
			{ id: '2' },
			{
				replaceOnChanges: ['id'],
			}
		)

		await workspace.deploy(nextApp)

		expect(events).toStrictEqual([
			'before-create',
			'after-create',
			'before-delete',
			'after-delete',
			'before-create',
			'after-create',
		])
	})
})

import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('replace resource', () => {
	const { workspace, logs, assertResourceExists, assertResourceNotExists } = createMockWorkSpace()

	it('step 1 - create resource 1', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '1' })

		await workspace.deploy(app)

		assertResourceExists('1')
		expect(logs).toStrictEqual(['create:1'])
	})

	it('step 2 - throw when updating immutable field', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '2' })

		await expect(workspace.deploy(app)).rejects.toThrowError()

		assertResourceExists('1')
		assertResourceNotExists('2')
	})

	it('step 3 - allow replacing immutable field', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: '2' }, { replaceOnChanges: ['id'] })

		await workspace.deploy(app)

		assertResourceExists('2')
		assertResourceNotExists('1')
	})
})

import { App, Stack } from '../src'
import { createMockWorkSpace, Resource } from './_mock'

describe('dependsOn', () => {
	const { workspace, assertResourceExists } = createMockWorkSpace()

	it('link deps via the dependsOn option', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const r1 = new Resource(stack, 'r1', { id: '1' })
		new Resource(stack, 'r2', { id: '2' }, { dependsOn: [r1] })

		await workspace.deploy(app)

		assertResourceExists('1')
		assertResourceExists('2')
	})
})

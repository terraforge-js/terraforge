import { App, isDataSource, isNode, isResource, Stack } from '../src'
import { Resource } from './_mock'

describe('node', () => {
	it('should be able to assert if resource is a node', async () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')
		const resource = new Resource(stack, 'r1', { id: '1' })

		expect(isNode(resource)).toBe(true)
		expect(isResource(resource)).toBe(true)
		expect(isDataSource(resource)).toBe(false)
	})
})

import { App, isDataSource, isNode, isResource, Stack } from '@terraforge/core'
import { createTerraformAPI, TerraformProvider } from '../src'

describe('Terraform Proxy API', () => {
	const app = new App('app')
	const stack = new Stack(app, 'stack')
	const provider = createTerraformAPI<any>({
		namespace: 'example',
		provider: {
			org: 'example',
			type: 'example',
			version: '1.0.0',
		},
	})

	it('the root provider should be a factory function for a TerraformProvider', () => {
		expectTypeOf(provider).toBeAny()
		expect(provider).toBeTypeOf('function')
		expect(provider()).toBeInstanceOf(TerraformProvider)
	})

	it('the provider should provide a install function', () => {
		expect(provider.install).toBeTypeOf('function')
	})

	it('lowercase access on the provider should be a namespace', () => {
		expect(provider.ns).toBeTypeOf('object')
	})

	it('capitalized access on the provider should be a resource class', () => {
		expect(provider.ns.Resource).toBeTypeOf('function')
	})

	it('the get function on a resource should be a datasource function', () => {
		expect(provider.ns.Resource.get).toBeTypeOf('function')
	})

	it('a resource instance should be a node', () => {
		const resource = new provider.ns.Resource(stack, 'resource', {})
		expect(resource).toBeTypeOf('object')
		expect(isNode(resource)).toBe(true)
		expect(isResource(resource)).toBe(true)
		expect(isDataSource(resource)).toBe(false)
	})

	it('capitalized access with the "get" prefix should be a datasource function', () => {
		expect(provider.ns.getResource).toBeTypeOf('function')
	})

	it('a datasource instance should be a node', () => {
		const dataSource = provider.ns.getDataSource(stack, 'dataSource', {})
		expect(dataSource).toBeTypeOf('object')
		expect(isNode(dataSource)).toBe(true)
		expect(isResource(dataSource)).toBe(false)
		expect(isDataSource(dataSource)).toBe(true)
	})
})

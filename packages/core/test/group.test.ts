import { App, createMeta, DataSource, Group, nodeMetaSymbol, Stack } from '../src'
import { Resource } from './_mock'

const createDataSourceNode = (parent: Group, type: string, id: string) => {
	const meta = createMeta('data', 'custom:test', parent, type, id, {})
	const node = { [nodeMetaSymbol]: meta, urn: meta.urn } as DataSource

	parent.add(node)

	return node
}

describe('group', () => {
	it('should throw for duplicate resources', () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		new Resource(stack, 'r1', { id: 'r1' })

		expect(() => new Resource(stack, 'r1', { id: 'r1' })).toThrow('Duplicate node found: resource:r1')
	})

	it('should throw for duplicate data sources', () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		createDataSourceNode(stack, 'thing', 'd1')

		expect(() => createDataSourceNode(stack, 'thing', 'd1')).toThrow('Duplicate node found: thing:d1')
	})

	it('should allow a resource and a data source with the same type and id', () => {
		const app = new App('app')
		const stack = new Stack(app, 'stack')

		const resource = new Resource(stack, 'same', { id: 'same' })
		const dataSource = createDataSourceNode(stack, 'resource', 'same')

		expect(resource.urn).not.toBe(dataSource.urn)
	})

	it('should throw for duplicate stacks', () => {
		const app = new App('app')

		new Stack(app, 'stack')

		expect(() => new Stack(app, 'stack')).toThrow('Duplicate group found: stack:stack')
	})

	it('should throw for duplicate groups', () => {
		const app = new App('app')

		new Group(app, 'grp', 'g1')

		expect(() => new Group(app, 'grp', 'g1')).toThrow('Duplicate group found: grp:g1')
	})

	it('should allow explicitly adding an already constructed group', () => {
		const app = new App('app')
		const group = new Group(app, 'grp', 'g1')

		expect(() => app.add(group)).not.toThrow()
		expect(app.nodes).toEqual([])
	})
})

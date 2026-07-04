import { App, MemoryLockBackend, MemoryStateBackend, Provider, Stack, URN, WorkSpace } from '../src'

describe('refresh data sources', () => {
	const createProvider = (getData?: Provider['getData']): Provider => ({
		ownResource: id => id === 'custom:test',
		async getResource() {
			throw new Error('not implemented')
		},
		async createResource() {
			throw new Error('not implemented')
		},
		async updateResource() {
			throw new Error('not implemented')
		},
		async deleteResource() {
			throw new Error('not implemented')
		},
		getData,
	})

	const setup = async (provider: Provider) => {
		const stateBackend = new MemoryStateBackend()
		const workspace = new WorkSpace({
			providers: [provider],
			backend: {
				state: stateBackend,
				lock: new MemoryLockBackend(),
			},
		})

		const app = new App('app')
		new Stack(app, 'stack')

		const dataUrn = 'urn:app:{app}:stack:{stack}:data:lookup:{d1}' as URN

		await stateBackend.update(app.urn, {
			name: 'app',
			version: 2,
			stacks: {
				'urn:app:{app}:stack:{stack}': {
					name: 'stack',
					nodes: {
						[dataUrn]: {
							tag: 'data',
							type: 'lookup',
							provider: 'custom:test',
							input: { id: 'd1' },
							output: { id: 'd1', value: 'old' },
							dependencies: [],
						},
					},
				},
			},
		} as never)

		return { workspace, stateBackend, app, dataUrn }
	}

	it('should skip data sources when the provider has no getData', async () => {
		const { workspace, app } = await setup(createProvider())

		// No operations — a missing capability is not a remote deletion.
		const result = await workspace.refresh(app)

		expect(result).toBeUndefined()
	})

	it('should report an update operation when the data changed', async () => {
		const { workspace, stateBackend, app, dataUrn } = await setup(
			createProvider(async () => ({ state: { id: 'd1', value: 'new' } }))
		)

		const result = await workspace.refresh(app)

		expect(result?.operations).toHaveLength(1)
		expect(result?.operations[0]).toMatchObject({ urn: dataUrn, operation: 'update' })

		for (const operation of result?.operations ?? []) {
			operation.commit()
		}

		await result?.commit()

		const state = await stateBackend.get(app.urn)
		const node = Object.values(state!.stacks)[0]!.nodes[dataUrn]!

		expect(node.output).toEqual({ id: 'd1', value: 'new' })
	})
})

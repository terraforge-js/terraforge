import { PluginClient } from '../src/plugin/client'
import { PluginServer } from '../src/plugin/server'
import { createPlugin6 } from '../src/plugin/version/6'
import { decodeDynamicValue, encodeDynamicValue } from '../src/plugin/version/util'

describe('plugin protocol 6', () => {
	const attribute = (name: string) => ({
		name,
		type: Buffer.from(JSON.stringify('string')),
		optional: true,
	})

	const createStubClient = () => {
		const calls: Array<{ method: string; payload: any }> = []

		const client: PluginClient = {
			async call(method, payload) {
				calls.push({ method, payload })

				switch (method) {
					case 'GetProviderSchema':
						return {
							provider: { block: { attributes: [attribute('region')] } },
							resourceSchemas: {
								example_thing: { block: { attributes: [attribute('name')] } },
							},
							dataSourceSchemas: {},
						}
					case 'PlanResourceChange':
						return {
							plannedState: encodeDynamicValue({ name: 'planned' }),
							requiresReplace: [],
						}
					default:
						return {}
				}
			},
		}

		return { client, calls }
	}

	const server = { kill() {} } as unknown as PluginServer

	it('configure should send the config to ConfigureProvider', async () => {
		const { client, calls } = createStubClient()
		const plugin = await createPlugin6({ server, client })

		await plugin.configure({ region: 'us-east-1' })

		const configure = calls.find(call => call.method === 'ConfigureProvider')!

		// Protocol 6 has no preparedConfig — the validated config itself
		// must be forwarded, not an absent response field.
		expect(configure.payload.config).toBeDefined()
		expect(decodeDynamicValue(configure.payload.config)).toEqual({ region: 'us-east-1' })
	})

	it('apply should send the planned state back verbatim, preserving unknown values', async () => {
		const { client, calls } = createStubClient()

		// A planned state of { name: <unknown> } — cty encodes "known after
		// apply" as msgpack fixext1 with extension type 0 (d4 00 00), which
		// a decode/re-encode round trip cannot preserve.
		const rawPlannedState = {
			msgpack: Buffer.from([0x81, 0xa4, 0x6e, 0x61, 0x6d, 0x65, 0xd4, 0x00, 0x00]),
		}

		client.call = async (method, payload) => {
			calls.push({ method, payload })

			switch (method) {
				case 'GetProviderSchema':
					return {
						provider: { block: { attributes: [attribute('region')] } },
						resourceSchemas: {
							example_thing: { block: { attributes: [attribute('name')] } },
						},
						dataSourceSchemas: {},
					}
				case 'PlanResourceChange':
					return { plannedState: rawPlannedState, requiresReplace: [] }
				case 'ApplyResourceChange':
					return { newState: encodeDynamicValue({ name: 'created' }) }
				default:
					return {}
			}
		}

		const plugin = await createPlugin6({ server, client })
		const plan = await plugin.planResourceChange('example_thing', null, { name: 'x' }, { name: 'x' })

		// The decoded planned state loses the unknown entirely — the raw
		// value is what must round trip back to the provider.
		expect(plan.plannedState).toEqual({})
		expect(plan.rawPlannedState).toBe(rawPlannedState)

		await plugin.applyResourceChange('example_thing', null, plan.plannedState, { name: 'x' }, plan.rawPlannedState)

		const apply = calls.find(call => call.method === 'ApplyResourceChange')!

		expect(apply.payload.plannedState).toBe(rawPlannedState)
	})

	it('planResourceChange should send the config state as config', async () => {
		const { client, calls } = createStubClient()
		const plugin = await createPlugin6({ server, client })

		await plugin.planResourceChange('example_thing', null, { name: 'merged' }, { name: 'config' })

		const plan = calls.find(call => call.method === 'PlanResourceChange')!

		expect(decodeDynamicValue(plan.payload.proposedNewState)).toEqual({ name: 'merged' })
		expect(decodeDynamicValue(plan.payload.config)).toEqual({ name: 'config' })
	})
})

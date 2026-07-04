import { TerraformProvider } from '../src'
import { Plugin } from '../src/plugin/version/type.ts'

describe('TerraformProvider createResource', () => {
	it('should plan before applying and send the planned state to apply', async () => {
		const calls: Array<{ method: string; args: unknown[] }> = []
		const rawPlannedState = { msgpack: Buffer.from([0x80]) }

		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_s3_bucket: {
							type: 'object',
							properties: {
								bucket: {
									type: 'string',
								},
							},
						},
					},
					dataSources: {},
				}
			},
			async stop() {},
			async configure() {},
			async readResource() {
				return {}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange(...args) {
				calls.push({ method: 'plan', args })

				return {
					requiresReplace: [],
					// The provider injected a default at plan time.
					plannedState: { bucket: 'example', acl: 'private' },
					rawPlannedState,
				}
			},
			async applyResourceChange(...args) {
				calls.push({ method: 'apply', args })

				return { bucket: 'example', acl: 'private' }
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await provider.createResource({
			type: 'aws_s3_bucket',
			state: { bucket: 'example' },
		})

		expect(calls.map(call => call.method)).toEqual(['plan', 'apply'])

		const plan = calls[0]!
		expect(plan.args).toEqual(['aws_s3_bucket', null, { bucket: 'example' }, { bucket: 'example' }])

		const apply = calls[1]!
		expect(apply.args).toEqual([
			'aws_s3_bucket',
			null,
			// The planned state — not the raw user input.
			{ bucket: 'example', acl: 'private' },
			{ bucket: 'example' },
			rawPlannedState,
		])
	})
})

import { type Property } from '../src/plugin/schema.ts'
import { formatOutputState } from '../src/plugin/version/util.ts'

describe('formatOutputState', () => {
	it('omits empty optional and computed top-level fields', () => {
		const schema: Property = {
			type: 'object',
			properties: {
				function_name: {
					type: 'string',
					required: true,
				},
				filename: {
					type: 'string',
					optional: true,
				},
				layers: {
					type: 'array',
					item: {
						type: 'string',
					},
					optional: true,
				},
				tags: {
					type: 'record',
					item: {
						type: 'string',
					},
					computed: true,
				},
				region: {
					type: 'string',
					computed: true,
				},
			},
		}

		expect(
			formatOutputState(schema, {
				function_name: 'fn',
				filename: null,
				layers: [],
				tags: {},
				region: 'us-east-1',
			})
		).toStrictEqual({
			functionName: 'fn',
			region: 'us-east-1',
		})
	})

	it('omits empty nested optional objects and preserves populated ones', () => {
		const schema: Property = {
			type: 'object',
			properties: {
				logging_config: {
					type: 'object',
					optional: true,
					properties: {
						log_group: {
							type: 'string',
							optional: true,
						},
						log_format: {
							type: 'string',
							optional: true,
						},
					},
				},
				vpc_config: {
					type: 'object',
					computed: true,
					properties: {
						subnet_ids: {
							type: 'array',
							item: {
								type: 'string',
							},
							optional: true,
						},
					},
				},
			},
		}

		expect(
			formatOutputState(schema, {
				logging_config: {
					log_group: '/aws/lambda/example',
					log_format: 'JSON',
				},
				vpc_config: null,
			})
		).toStrictEqual({
			loggingConfig: {
				logGroup: '/aws/lambda/example',
				logFormat: 'JSON',
			},
		})
	})

	it('keeps explicit empty values for required fields', () => {
		const schema: Property = {
			type: 'object',
			properties: {
				architectures: {
					type: 'array',
					item: {
						type: 'string',
					},
					required: true,
				},
			},
		}

		expect(
			formatOutputState(schema, {
				architectures: [],
			})
		).toStrictEqual({
			architectures: [],
		})
	})
})

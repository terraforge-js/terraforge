import { type Property } from '../src/plugin/schema.ts'
import { formatInputState } from '../src/plugin/version/util.ts'

describe('formatInputState', () => {
	it('encodes absent blocks as empty collections, never null', () => {
		// Modeled on aws_lb_listener's default_action: the forward block is
		// absent when the target_group_arn shorthand is used. Terraform
		// encodes absent blocks as empty collections — provider code panics
		// on null (IsKnown-only guards, e.g. flattenForwardActionOneOf).
		const schema: Property = {
			type: 'object',
			properties: {
				default_action: {
					type: 'array',
					block: true,
					item: {
						type: 'object',
						properties: {
							type: {
								type: 'string',
								required: true,
							},
							order: {
								type: 'number',
								optional: true,
							},
							target_group_arn: {
								type: 'string',
								optional: true,
							},
							forward: {
								type: 'array',
								block: true,
								item: {
									type: 'object',
									properties: {},
								},
							},
							mutual_authentication: {
								type: 'record',
								block: true,
								item: {
									type: 'string',
								},
							},
						},
					},
				},
			},
		}

		expect(
			formatInputState(schema, {
				defaultAction: [
					{
						type: 'forward',
						order: 1,
						targetGroupArn: 'arn:aws:elasticloadbalancing:...',
					},
				],
			})
		).toStrictEqual({
			default_action: [
				{
					type: 'forward',
					order: 1,
					target_group_arn: 'arn:aws:elasticloadbalancing:...',
					forward: [],
					mutual_authentication: {},
				},
			],
		})
	})

	it('keeps absent attribute-typed collections as null', () => {
		const schema: Property = {
			type: 'object',
			properties: {
				// An attribute-typed list (no block marker) is nullable.
				layers: {
					type: 'array',
					optional: true,
					item: {
						type: 'string',
					},
				},
			},
		}

		expect(formatInputState(schema, {})).toStrictEqual({
			layers: null,
		})
	})
})

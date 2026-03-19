import { TerraformProvider } from '../src'
import { Plugin } from '../src/plugin/version/type.ts'

describe('TerraformProvider refreshResource', () => {
	it('treats provider-populated optional/computed values as unchanged when plan keeps them', async () => {
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
								policy: {
									type: 'string',
									optional: true,
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
				return {
					bucket: 'example',
					policy: '{"Version":"2012-10-17"}',
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange(_type, priorState) {
				return {
					requiresReplace: [],
					plannedState: priorState ?? {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_s3_bucket',
				priorInputState: {
					bucket: 'example',
				},
				priorOutputState: {
					bucket: 'example',
					policy: '',
				},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				bucket: 'example',
				policy: '{"Version":"2012-10-17"}',
			},
		})
	})

	it('reports drift as updated when terraform planning would change the refreshed state', async () => {
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
								policy: {
									type: 'string',
									optional: true,
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
				return {
					bucket: 'example',
					policy: '{"Version":"2012-10-17"}',
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {
						bucket: 'example',
						policy: '',
					},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_s3_bucket',
				priorInputState: {
					bucket: 'example',
					policy: '',
				},
				priorOutputState: {
					bucket: 'example',
					policy: '',
				},
			})
		).resolves.toStrictEqual({
			kind: 'updated',
			state: {
				bucket: 'example',
				policy: '{"Version":"2012-10-17"}',
			},
			inputState: {
				bucket: 'example',
				policy: '{"Version":"2012-10-17"}',
			},
		})
	})

	it('treats schema-defined set ordering differences as unchanged', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_cognito_user_pool_client: {
							type: 'object',
							properties: {
								explicit_auth_flows: {
									type: 'array',
									collectionKind: 'set',
									item: {
										type: 'string',
									},
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
				return {
					explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {
						explicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
					},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_cognito_user_pool_client',
				priorInputState: {},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
			},
		})
	})

	it('ignores computed and config-only fields that are not present in the prior input', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_cloudfront_distribution_tenant: {
							type: 'object',
							properties: {
								name: {
									type: 'string',
									required: true,
								},
								enabled: {
									type: 'boolean',
									required: true,
								},
								wait_for_deployment: {
									type: 'boolean',
									optional: true,
								},
								status: {
									type: 'string',
									computed: true,
								},
								domain: {
									type: 'array',
									item: {
										type: 'object',
										properties: {
											domain: {
												type: 'string',
												required: true,
											},
											status: {
												type: 'string',
												computed: true,
											},
										},
									},
									optional: true,
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
				return {
					name: 'dist',
					enabled: true,
					status: 'Deployed',
					domain: [
						{
							domain: 'awsless.com',
							status: 'active',
						},
					],
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {
						name: 'dist',
						enabled: true,
						waitForDeployment: true,
						domain: [
							{
								domain: 'awsless.com',
							},
						],
					},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_cloudfront_distribution_tenant',
				priorInputState: {
					name: 'dist',
					enabled: true,
					domain: [
						{
							domain: 'awsless.com',
						},
					],
				},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				name: 'dist',
				enabled: true,
				status: 'Deployed',
				domain: [
					{
						domain: 'awsless.com',
						status: 'active',
					},
				],
			},
		})
	})

	it('treats semantically identical refreshed input as unchanged', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_route53_record: {
							type: 'object',
							properties: {
								zone_id: {
									type: 'string',
									required: true,
								},
								name: {
									type: 'string',
									required: true,
								},
								type: {
									type: 'string',
									required: true,
								},
								ttl: {
									type: 'number',
									optional: true,
								},
								records: {
									type: 'array',
									item: {
										type: 'string',
									},
									optional: true,
								},
								allow_overwrite: {
									type: 'boolean',
									optional: true,
								},
								fqdn: {
									type: 'string',
									computed: true,
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
				return {
					zoneId: 'Z1',
					name: '_abc.example.com.',
					type: 'CNAME',
					ttl: 300,
					records: ['_validation.example.com.'],
					allowOverwrite: true,
					fqdn: '_abc.example.com',
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_route53_record',
				priorInputState: {
					zoneId: 'Z1',
					name: '_abc.example.com.',
					type: 'CNAME',
					ttl: 300,
					records: ['_validation.example.com.'],
					allowOverwrite: true,
				},
				priorOutputState: {
					zoneId: 'Z1',
					name: '_abc.example.com.',
					type: 'CNAME',
					ttl: 300,
					records: ['_validation.example.com.'],
					allowOverwrite: true,
					fqdn: '_abc.example.com',
				},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				zoneId: 'Z1',
				name: '_abc.example.com.',
				type: 'CNAME',
				ttl: 300,
				records: ['_validation.example.com.'],
				allowOverwrite: true,
				fqdn: '_abc.example.com',
			},
		})
	})

	it('treats semantically equal json strings as unchanged', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_iam_role: {
							type: 'object',
							properties: {
								assume_role_policy: {
									type: 'string',
									required: true,
								},
								description: {
									type: 'string',
									optional: true,
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
				return {
					assumeRolePolicy:
						'{"Statement":[{"Action":"sts:AssumeRole","Effect":"Allow","Principal":{"Service":"scheduler.amazonaws.com"}}],"Version":"2012-10-17"}',
					description: 'Task schedule app-jack-next',
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_iam_role',
				priorInputState: {
					assumeRolePolicy:
						'{"Version":"2012-10-17","Statement":[{"Action":"sts:AssumeRole","Effect":"Allow","Principal":{"Service":"scheduler.amazonaws.com"}}]}',
					description: 'Task schedule app-jack-next',
				},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				assumeRolePolicy:
					'{"Statement":[{"Action":"sts:AssumeRole","Effect":"Allow","Principal":{"Service":"scheduler.amazonaws.com"}}],"Version":"2012-10-17"}',
				description: 'Task schedule app-jack-next',
			},
		})
	})

	it('treats omitted empty optional nested objects as unchanged', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_cloudfront_cache_policy: {
							type: 'object',
							properties: {
								parameters_in_cache_key_and_forwarded_to_origin: {
									type: 'object',
									required: true,
									properties: {
										cookies_config: {
											type: 'object',
											required: true,
											properties: {
												cookie_behavior: {
													type: 'string',
													required: true,
												},
												cookies: {
													type: 'object',
													optional: true,
													properties: {},
												},
											},
										},
										query_strings_config: {
											type: 'object',
											required: true,
											properties: {
												query_string_behavior: {
													type: 'string',
													required: true,
												},
												query_strings: {
													type: 'object',
													optional: true,
													properties: {},
												},
											},
										},
									},
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
				return {
					parametersInCacheKeyAndForwardedToOrigin: {
						cookiesConfig: {
							cookieBehavior: 'none',
						},
						queryStringsConfig: {
							queryStringBehavior: 'none',
						},
					},
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_cloudfront_cache_policy',
				priorInputState: {
					parametersInCacheKeyAndForwardedToOrigin: {
						cookiesConfig: {
							cookieBehavior: 'none',
							cookies: {},
						},
						queryStringsConfig: {
							queryStringBehavior: 'none',
							queryStrings: {},
						},
					},
				},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				parametersInCacheKeyAndForwardedToOrigin: {
					cookiesConfig: {
						cookieBehavior: 'none',
					},
					queryStringsConfig: {
						queryStringBehavior: 'none',
					},
				},
			},
		})
	})

	it('drops nulls and duplicate values from set-like inputs during comparison', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_acm_certificate_validation: {
							type: 'object',
							properties: {
								validation_record_fqdns: {
									type: 'array',
									collectionKind: 'set',
									item: {
										type: 'string',
									},
									required: true,
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
				return {
					validationRecordFqdns: ['_a.example.com'],
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_acm_certificate_validation',
				priorInputState: {
					validationRecordFqdns: ['_a.example.com', '_a.example.com', null],
				},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				validationRecordFqdns: ['_a.example.com'],
			},
		})
	})

	it('treats missing empty nested marker objects as unchanged', async () => {
		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_wafv2_web_acl: {
							type: 'object',
							properties: {
								name: {
									type: 'string',
									required: true,
								},
								description: {
									type: 'string',
									optional: true,
								},
								default_action: {
									type: 'object',
									required: true,
									properties: {
										allow: {
											type: 'object',
											properties: {},
										},
									},
								},
								rule: {
									type: 'array',
									required: true,
									item: {
										type: 'object',
										properties: {
											name: {
												type: 'string',
												required: true,
											},
											priority: {
												type: 'number',
												required: true,
											},
											action: {
												type: 'object',
												required: true,
												properties: {
													block: {
														type: 'object',
														properties: {},
													},
												},
											},
										},
									},
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
				return {
					name: 'waf',
					description: 'AWS Managed Rules Rule Set',
					defaultAction: {},
					rule: [
						{
							name: 'rateLimiter',
							priority: 3,
							action: {},
						},
					],
				}
			},
			async readDataSource() {
				return {}
			},
			async validateResource() {},
			async planResourceChange() {
				return {
					requiresReplace: [],
					plannedState: {},
				}
			},
			async applyResourceChange() {
				return {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.refreshResource?.({
				type: 'aws_wafv2_web_acl',
				priorInputState: {
					name: 'waf',
					description: 'AWS Managed Rules Rule Set',
					defaultAction: {
						allow: {},
					},
					rule: [
						{
							name: 'rateLimiter',
							priority: 3,
							action: {
								block: {},
							},
						},
					],
				},
				priorOutputState: {},
			})
		).resolves.toStrictEqual({
			kind: 'unchanged',
			state: {
				name: 'waf',
				description: 'AWS Managed Rules Rule Set',
				defaultAction: {},
				rule: [
					{
						name: 'rateLimiter',
						priority: 3,
						action: {},
					},
				],
			},
		})
	})
})

describe('TerraformProvider updateResource', () => {
	it('plans and applies drifted remote state back to the desired input', async () => {
		const calls: {
			plan?: {
				type: string
				priorState: Record<string, unknown> | null
				proposedNewState: Record<string, unknown> | null
				configState: Record<string, unknown> | null
			}
			apply?: {
				type: string
				priorState: Record<string, unknown> | null
				plannedState: Record<string, unknown> | null
				configState: Record<string, unknown> | null
			}
		} = {}

		const plugin: Plugin = {
			schema() {
				return {
					provider: {
						type: 'object',
						properties: {},
					},
					resources: {
						aws_lambda_function: {
							type: 'object',
							properties: {
								timeout: {
									type: 'number',
									required: true,
								},
								function_name: {
									type: 'string',
									required: true,
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
			async planResourceChange(type, priorState, proposedNewState, configState) {
				calls.plan = {
					type,
					priorState,
					proposedNewState,
					configState,
				}

				return {
					requiresReplace: [],
					plannedState: proposedNewState ?? {},
				}
			},
			async applyResourceChange(type, priorState, plannedState, configState) {
				calls.apply = {
					type,
					priorState,
					plannedState,
					configState,
				}

				return plannedState ?? {}
			},
		}

		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.updateResource({
				type: 'aws_lambda_function',
				priorState: {
					functionName: 'fn',
					timeout: 20,
				},
				proposedState: {
					functionName: 'fn',
					timeout: 10,
				},
			})
		).resolves.toStrictEqual({
			version: 0,
			state: {
				functionName: 'fn',
				timeout: 10,
			},
		})

		expect(calls.plan).toStrictEqual({
			type: 'aws_lambda_function',
			priorState: {
				functionName: 'fn',
				timeout: 20,
			},
			proposedNewState: {
				functionName: 'fn',
				timeout: 10,
			},
			configState: {
				functionName: 'fn',
				timeout: 10,
			},
		})

		expect(calls.apply).toStrictEqual({
			type: 'aws_lambda_function',
			priorState: {
				functionName: 'fn',
				timeout: 20,
			},
			plannedState: {
				functionName: 'fn',
				timeout: 10,
			},
			configState: {
				functionName: 'fn',
				timeout: 10,
			},
		})
	})
})

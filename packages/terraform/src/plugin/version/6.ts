import type { PluginClient } from '../client.ts'
import { parseProviderSchema, parseResourceSchema } from '../schema.ts'
import type { PluginServer } from '../server.ts'
import type { Plugin } from './type.ts'
import {
	decodeDynamicValue,
	encodeDynamicValue,
	filterRequiresReplace,
	formatAttributePath,
	formatInputState,
	formatOutputState,
	getResourceSchema,
} from './util.ts'

export const createPlugin6 = async ({
	server,
	client,
}: {
	server: PluginServer
	client: PluginClient
}): Promise<Plugin> => {
	const schema = await client.call('GetProviderSchema')
	const provider = parseProviderSchema(schema.provider)
	const resources = parseResourceSchema(schema.resourceSchemas)
	const dataSources = parseResourceSchema(schema.dataSourceSchemas)

	return {
		schema() {
			return {
				provider,
				resources,
				dataSources,
			}
		},
		async stop() {
			await client.call('StopProvider')
			server.kill()
		},
		async configure(config) {
			const prepared = await client.call('ValidateProviderConfig', {
				config: encodeDynamicValue(formatInputState(provider, config)),
			})

			await client.call('ConfigureProvider', {
				config: prepared.preparedConfig,
			})
		},
		async readResource(type, state) {
			const schema = getResourceSchema(resources, type)
			const read = await client.call('ReadResource', {
				typeName: type,
				currentState: encodeDynamicValue(formatInputState(schema, state)),
			})

			return formatOutputState(schema, decodeDynamicValue(read.newState))
		},
		async readDataSource(type, state) {
			const schema = getResourceSchema(dataSources, type)
			const read = await client.call('ReadDataSource', {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema, state)),
			})

			return formatOutputState(schema, decodeDynamicValue(read.state))
		},
		async validateResource(type, state) {
			const schema = getResourceSchema(resources, type)
			await client.call('ValidateResourceConfig', {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema, state)),
			})
		},
		async planResourceChange(
			type: string,
			priorState: Record<string, unknown> | null,
			proposedState: Record<string, unknown> | null
		) {
			const schema = getResourceSchema(resources, type)
			const preparedPriorState = formatInputState(schema, priorState)
			const preparedProposedState = formatInputState(schema, proposedState)
			const configState = formatInputState(schema, proposedState)

			const plan = await client.call('PlanResourceChange', {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				proposedNewState: encodeDynamicValue(preparedProposedState),
				config: encodeDynamicValue(configState),
			})

			const rawPlannedState = decodeDynamicValue(plan.plannedState)
			const plannedState = formatOutputState(schema, rawPlannedState)
			const requiresReplace = filterRequiresReplace(
				formatAttributePath(plan.requiresReplace),
				preparedPriorState as Record<string, unknown>,
				preparedProposedState as Record<string, unknown>
			)

			return {
				requiresReplace,
				plannedState,
			}
		},
		async applyResourceChange(
			type: string,
			priorState: Record<string, unknown> | null,
			plannedState: Record<string, unknown> | null,
			configState: Record<string, unknown> | null
		) {
			const schema = getResourceSchema(resources, type)
			const preparedPriorState = formatInputState(schema, priorState)
			const preparedPlannedState = formatInputState(schema, plannedState)
			const preparedConfigState = formatInputState(schema, configState)

			const apply = await client.call('ApplyResourceChange', {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				plannedState: encodeDynamicValue(preparedPlannedState),
				config: encodeDynamicValue(preparedConfigState),
			})

			return formatOutputState(schema, decodeDynamicValue(apply.newState))
		},
	}
}

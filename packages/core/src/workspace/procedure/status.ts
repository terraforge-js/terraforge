import { App } from '../../app.ts'
import { Future } from '../../future.ts'
import { getMeta, isResource } from '../../node.ts'
import { Output } from '../../output.ts'
import { URN } from '../../urn.ts'
import { compareState, NodeState } from '../state.ts'
import { WorkSpaceOptions } from '../workspace.ts'

/**
 * The status of a resource comparing local config with state file.
 *
 * - `created`: Resource exists in state and matches current config
 * - `changed`: Resource exists in state but config has changed
 * - `pending`: Resource exists in config but not yet deployed (no state)
 * - `stale`: Resource exists in state but was removed from config
 */
export type ResourceStatus = 'created' | 'changed' | 'pending' | 'stale'

export type ResourceStatusInfo = {
	urn: URN
	type: string
	provider: string
	tag: 'resource' | 'data'
	status: ResourceStatus
}

/**
 * Extract static values from inputs, omitting Output/Future/Promise values.
 * This allows comparing only the static parts of config without needing to resolve dependencies.
 * We omit dynamic values entirely rather than using placeholders, since the state file
 * contains resolved values that we can't meaningfully compare against.
 */
const extractStaticInputs = (inputs: unknown): unknown => {
	if (inputs instanceof Output || inputs instanceof Future || inputs instanceof Promise) {
		// Omit dynamic values - return undefined so they're excluded from comparison
		return undefined
	}

	if (Array.isArray(inputs)) {
		return inputs.map(extractStaticInputs)
	}

	if (inputs !== null && typeof inputs === 'object' && inputs.constructor === Object) {
		const result: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(inputs)) {
			const extracted = extractStaticInputs(value)
			// Only include non-undefined values
			if (extracted !== undefined) {
				result[key] = extracted
			}
		}
		return result
	}

	return inputs
}

/**
 * Remove keys from state that correspond to dynamic (Output/Future/Promise) values in config.
 * This ensures we only compare static values that exist in both.
 */
const filterStateToMatchConfig = (state: unknown, config: unknown): unknown => {
	if (config instanceof Output || config instanceof Future || config instanceof Promise) {
		// Config has dynamic value, exclude this from state comparison
		return undefined
	}

	if (Array.isArray(config) && Array.isArray(state)) {
		return config.map((configItem, index) => filterStateToMatchConfig(state[index], configItem))
	}

	if (
		config !== null &&
		typeof config === 'object' &&
		config.constructor === Object &&
		state !== null &&
		typeof state === 'object'
	) {
		const result: Record<string, unknown> = {}
		for (const [key, configValue] of Object.entries(config)) {
			const stateValue = (state as Record<string, unknown>)[key]
			const filtered = filterStateToMatchConfig(stateValue, configValue)
			if (filtered !== undefined) {
				result[key] = filtered
			}
		}
		return result
	}

	return state
}

export const status = async (app: App, opt: WorkSpaceOptions): Promise<ResourceStatusInfo[]> => {
	const appState = await opt.backend.state.get(app.urn)

	const resources: ResourceStatusInfo[] = []

	// Track which URNs are in the current config
	const configuredUrns: Set<string> = new Set()

	for (const stack of app.stacks) {
		for (const node of stack.nodes) {
			configuredUrns.add(getMeta(node).urn)
		}
	}

	// Process each stack in the app
	for (const stack of app.stacks) {
		const stackState = appState?.stacks[stack.urn]

		for (const node of stack.nodes) {
			const meta = getMeta(node)
			const nodeState = stackState?.nodes[meta.urn]

			const baseInfo = {
				urn: meta.urn,
				type: meta.type,
				provider: meta.provider,
				tag: (isResource(node) ? 'resource' : 'data') as 'resource' | 'data',
			}

			// No state exists - resource is pending deployment
			if (!nodeState) {
				resources.push({
					...baseInfo,
					status: 'pending',
				})
				continue
			}

			// Compare current config input with state input (static values only)
			// Extract only static values from config, and filter state to match the same keys
			const currentInput = extractStaticInputs(meta.input)
			const stateInput = filterStateToMatchConfig(nodeState.input, meta.input)
			const hasChanged = !compareState(
				stateInput as Record<string, unknown>,
				currentInput as Record<string, unknown>
			)

			resources.push({
				...baseInfo,
				status: hasChanged ? 'changed' : 'created',
			})
		}

		// Check for stale resources (exist in state but not in config)
		if (stackState) {
			for (const [urn, nodeState] of Object.entries(stackState.nodes)) {
				if (!configuredUrns.has(urn)) {
					resources.push({
						urn: urn as URN,
						type: nodeState.type,
						provider: nodeState.provider,
						tag: nodeState.tag,
						status: 'stale',
					})
				}
			}
		}
	}

	// Check for stale stacks (exist in state but not in app config)
	if (appState) {
		const configuredStackUrns = new Set(app.stacks.map(s => s.urn))

		for (const [stackUrn, stackState] of Object.entries(appState.stacks)) {
			if (!configuredStackUrns.has(stackUrn as URN)) {
				for (const [urn, nodeState] of Object.entries(stackState.nodes) as [string, NodeState][]) {
					resources.push({
						urn: urn as URN,
						type: nodeState.type,
						provider: nodeState.provider,
						tag: nodeState.tag,
						status: 'stale',
					})
				}
			}
		}
	}

	return resources
}

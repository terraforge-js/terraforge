import {
	PlanProps,
	RefreshResourceProps,
	ResourceNotFound,
	type CreateProps,
	type DeleteProps,
	type GetDataProps,
	type GetProps,
	type Provider,
	type State,
	type UpdateProps,
} from '@terraforge/core'

import { Plugin } from './plugin/version/type.ts'
import { getResourceSchema, normalizeStateForComparison, stableStringify } from './plugin/version/util.ts'

export class TerraformProvider implements Provider {
	private configured?: Promise<void>
	private plugin?: Promise<Plugin>

	constructor(
		private type: string,
		private id: string,
		private createPlugin: () => Promise<Plugin>,
		private config: State
	) {}

	private async configure() {
		const plugin = await this.prepare()

		if (!this.configured) {
			this.configured = plugin.configure(this.config)
		}

		await this.configured

		return plugin
	}

	private prepare() {
		if (!this.plugin) {
			this.plugin = this.createPlugin()
		}

		return this.plugin
	}

	async destroy(): Promise<void> {
		if (this.plugin) {
			const plugin = await this.plugin
			plugin.stop()

			this.plugin = undefined
			this.configured = undefined
		}
	}

	ownResource(id: string): boolean {
		return `terraform:${this.type}:${this.id}` === id
	}

	async getResource({ type, state }: GetProps) {
		const plugin = await this.configure()
		const newState = await plugin.readResource(type, state)

		if (!newState) {
			throw new ResourceNotFound()
		}

		return {
			version: 0,
			state: newState,
		}
	}

	async createResource({ type, state }: CreateProps) {
		const plugin = await this.configure()
		const newState = await plugin.applyResourceChange(type, null, state, state)

		return {
			version: 0,
			state: newState,
		}
	}

	async updateResource({ type, priorState, proposedState }: UpdateProps) {
		const plugin = await this.configure()
		const mergedState = { ...priorState, ...proposedState }
		const { requiresReplace, plannedState } = await plugin.planResourceChange(
			type,
			priorState,
			mergedState,
			proposedState
		)

		if (requiresReplace.length > 0) {
			const formattedAttrs = requiresReplace.map(p => p.join('.')).join('", "')

			throw new Error(
				`Updating the "${formattedAttrs}" properties for the "${type}" resource will require the resource to be replaced.`
			)
		}

		const newState = await plugin.applyResourceChange(type, priorState, plannedState, proposedState)

		return {
			version: 0,
			state: newState,
		}
	}

	async deleteResource({ type, state }: DeleteProps) {
		const plugin = await this.configure()
		try {
			await plugin.applyResourceChange(type, state, null, null)
		} catch (error) {
			// -------------------------------------------------------
			// Sadly terraform doesn't have a normalized error for
			// deleting resources that no longer exist.
			// So we need to check if the resource exists with every
			// error and throw our own custom ResourceNotFound error.

			try {
				const newState = await plugin.readResource(type, state)

				if (!newState) {
					throw new ResourceNotFound()
				}
			} catch (_) {}

			throw error
		}
	}

	async planResourceChange({ type, priorState, proposedState }: PlanProps) {
		const plugin = await this.configure()
		const mergedState = { ...priorState, ...proposedState }
		const result = await plugin.planResourceChange(type, priorState, mergedState, proposedState)

		return {
			version: 0,
			requiresReplacement: result.requiresReplace.length > 0,
			state: result.plannedState,
		}
	}

	async getData({ type, state }: GetDataProps) {
		const plugin = await this.configure()
		const data = await plugin.readDataSource(type, state)

		if (!data) {
			throw new Error(`Data source not found ${type}`)
		}

		return {
			state: data,
		}
	}

	async refreshResource({ type, priorInputState, priorOutputState }: RefreshResourceProps) {
		const plugin = await this.configure()
		const schema = getResourceSchema(plugin.schema().resources, type)
		const refreshedState = await plugin.readResource(type, priorOutputState)

		if (!refreshedState) {
			return {
				kind: 'deleted' as const,
			}
		}

		const normalizedPriorInputState = normalizeStateForComparison(
			schema,
			priorInputState,
			priorInputState
		) as State
		const normalizedRefreshedState = normalizeStateForComparison(schema, refreshedState, priorInputState) as State

		if (stableStringify(normalizedPriorInputState) === stableStringify(normalizedRefreshedState)) {
			return {
				kind: 'unchanged' as const,
				state: refreshedState,
			}
		}

		return {
			kind: 'updated' as const,
			state: refreshedState,
			inputState: normalizedRefreshedState,
		}
	}

	// async generateTypes(dir: string) {
	// 	const plugin = await this.prepare()
	// 	const schema = plugin.schema()
	// 	const types = generateTypes(
	// 		{
	// 			[`${this.type}_provider`]: schema.provider,
	// 		},
	// 		schema.resources,
	// 		schema.dataSources
	// 	)

	// 	await mkdir(dir, { recursive: true })
	// 	await writeFile(join(dir, `${this.type}.d.ts`), types)
	// 	await this.destroy()
	// }
}

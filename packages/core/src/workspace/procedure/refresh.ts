import { App } from '../../app.ts'
import { findProvider } from '../../provider.ts'
import { URN } from '../../urn.ts'
import { createConcurrencyQueue } from '../concurrency.ts'
import { compareState, StackState } from '../state.ts'
import { ProcedureOptions, WorkSpaceOptions } from '../workspace.ts'

type ChangeOperation = {
	urn: URN
	operation: 'delete' | 'update'
	commit(): void
}

export const refresh = async (app: App, opt: WorkSpaceOptions & ProcedureOptions) => {
	const appState = await opt.backend.state.get(app.urn)
	const queue = createConcurrencyQueue(opt.concurrency ?? 10)

	// -------------------------------------------------------
	// Filter only the selected stacks

	let filteredStacks: StackState[] = Object.values(appState?.stacks ?? {})

	if (opt.filters && opt.filters.length > 0) {
		filteredStacks = Object.entries(appState?.stacks ?? {})
			.filter(([stackName]) => {
				return opt.filters!.includes(stackName)
			})
			.map(([_, state]) => state)
	}

	// -------------------------------------------------------

	if (appState && filteredStacks.length > 0) {
		const operations: (ChangeOperation | undefined)[][] = await Promise.all(
			filteredStacks.map(stackState => {
				return Promise.all(
					Object.entries(stackState.nodes).map(([_urn, nodeState]) => {
						const urn = _urn as URN
						return queue(async () => {
							const provider = findProvider(opt.providers, nodeState.provider)

							let result
							if (nodeState.tag === 'data') {
								result = await provider.getData?.({
									type: nodeState.type,
									state: nodeState.output,
								})
							} else {
								result = await provider.getResource({
									type: nodeState.type,
									state: nodeState.output,
								})
							}

							console.log(urn)
							console.log(nodeState.output)
							console.log(result?.state)

							if (!result) {
								return {
									urn,
									operation: 'delete' as const,
									commit() {
										delete stackState.nodes[urn]
									},
								}
							} else if (!compareState(result.state, nodeState.output)) {
								return {
									urn,
									operation: 'update' as const,
									commit() {
										nodeState.input = result.state
										nodeState.output = result.state
									},
								}
							}

							return
						})
					})
				)
			})
		)

		const filteredOperations = operations.flat().filter(op => !!op)

		if (filteredOperations.length === 0) {
			return
		}

		return {
			operations: filteredOperations,
			async commit() {
				await opt.backend.state.update(app.urn, appState)
			},
		}
	}

	return
}

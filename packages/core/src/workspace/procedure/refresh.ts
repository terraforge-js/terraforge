import { App } from '../../app.ts'
import { State } from '../../meta.ts'
import { findProvider } from '../../provider.ts'
import { URN } from '../../urn.ts'
import { createConcurrencyQueue } from '../concurrency.ts'
import { compareState, NodeState, StackState } from '../state.ts'
import { ProcedureOptions, WorkSpaceOptions } from '../workspace.ts'

type ChangeOperation =
	| {
			urn: URN
			operation: 'delete'
			commit(): void
	  }
	| {
			urn: URN
			operation: 'update'
			before: State
			after: State
			commit(): void
	  }

// const clone = <T>(value: T): T => {
// 	return JSON.parse(JSON.stringify(value))
// }

const createDeleteOperation = (urn: URN, stackState: StackState, onCommit: () => void): ChangeOperation => {
	return {
		urn,
		operation: 'delete',
		commit() {
			delete stackState.nodes[urn]
			onCommit()
		},
	}
}

const createUpdateOperation = (
	urn: URN,
	state: State,
	before: State,
	after: State,
	nodeState: NodeState,
	onCommit: () => void
): ChangeOperation => {
	return {
		urn,
		operation: 'update' as const,
		before: structuredClone(before),
		after: structuredClone(after),
		commit() {
			nodeState.output = state
			nodeState.drifted = true
			onCommit()
		},
	}
}

export const refresh = async (app: App, opt: WorkSpaceOptions & ProcedureOptions) => {
	const appState = await opt.backend.state.get(app.urn)
	const queue = createConcurrencyQueue(opt.concurrency ?? 10)

	// -------------------------------------------------------
	// Filter only the selected stacks

	let filteredStacks: StackState[] = Object.values(appState?.stacks ?? {})

	if (opt.filters && opt.filters.length > 0) {
		filteredStacks = Object.values(appState?.stacks ?? {}).filter(stackState => {
			return opt.filters!.includes(stackState.name)
		})
	}

	// -------------------------------------------------------
	let committed = 0

	if (appState && filteredStacks.length > 0) {
		const operations: (ChangeOperation | undefined)[][] = await Promise.all(
			filteredStacks.map(stackState => {
				return Promise.all(
					Object.entries(stackState.nodes).map(([_urn, nodeState]) => {
						const urn = _urn as URN
						return queue(async () => {
							const provider = findProvider(opt.providers, nodeState.provider)

							if (nodeState.tag === 'data') {
								const result = await provider.getData?.({
									type: nodeState.type,
									state: nodeState.output,
								})

								if (!result) {
									return createDeleteOperation(urn, stackState, () => {
										committed++
									})
								}

								if (compareState(result.state, nodeState.output)) {
									return
								}

								return createUpdateOperation(
									urn,
									result.state,
									nodeState.input,
									result.state,
									nodeState,
									() => {
										committed++
									}
								)
							}

							if (!provider.refreshResource) {
								return
							}

							const refreshed = await provider.refreshResource({
								type: nodeState.type,
								priorInputState: nodeState.input,
								priorOutputState: nodeState.output,
							})

							if (!refreshed || refreshed.kind === 'unchanged') {
								return
							}

							if (refreshed.kind === 'deleted') {
								return createDeleteOperation(urn, stackState, () => {
									committed++
								})
							}

							return createUpdateOperation(
								urn,
								refreshed.state,
								nodeState.input,
								refreshed.inputState,
								nodeState,
								() => {
									committed++
								}
							)
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
				if (committed > 0) {
					await opt.backend.state.update(app.urn, appState)
				}
			},
		}
	}

	return
}

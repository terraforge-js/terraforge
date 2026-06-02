import { App } from '../../app.ts'
import { URN } from '../../urn.ts'
import { createConcurrencyQueue } from '../concurrency.ts'
import { DependencyGraph, dependentsOn } from '../dependency.ts'
import { entries } from '../entries.ts'
import { AppError } from '../error.ts'
import { NodeState, removeEmptyStackStates } from '../state.ts'
import { migrateAppState } from '../state/migrate.ts'
import { ProcedureOptions, WorkSpaceOptions } from '../workspace.ts'
import { deleteResource } from './delete-resource.ts'

export const deleteApp = async (app: App, opt: WorkSpaceOptions & ProcedureOptions) => {
	const stackNameByNodeUrn = new Map<URN, string>()

	// -------------------------------------------------------
	// Add a deploy log

	await opt.backend.activityLog?.log(app.urn, {
		action: 'delete',
		filters: opt.filters,
	})

	// -------------------------------------------------------
	// Get latest state

	const latestState = await opt.backend.state.get(app.urn)

	if (!latestState) {
		throw new AppError(app.name, [], `App already deleted: ${app.name}`)
	}

	// -------------------------------------------------------
	// Migrate the state file to the latest version

	const appState = migrateAppState(latestState)

	// -------------------------------------------------------
	// Set the idempotent token when no token exists.

	if (opt.idempotentToken || !appState.idempotentToken) {
		appState.idempotentToken = opt.idempotentToken ?? crypto.randomUUID()

		await opt.backend.state.update(app.urn, appState)
	}

	// -------------------------------------------------------
	// Filter stacks

	let stackStates = Object.values(appState.stacks)

	if (opt.filters && opt.filters.length > 0) {
		stackStates = stackStates.filter(stackState => opt.filters!.includes(stackState.name))
	}

	// -------------------------------------------------------

	const queue = createConcurrencyQueue(opt.concurrency ?? 10)
	const graph = new DependencyGraph()

	// -------------------------------------------------------

	const allNodes: Record<URN, NodeState> = {}

	for (const stackState of Object.values(appState.stacks)) {
		for (const [urn, nodeState] of entries(stackState.nodes)) {
			allNodes[urn] = nodeState
			stackNameByNodeUrn.set(urn, stackState.name)
		}
	}

	// -------------------------------------------------------

	for (const stackState of stackStates) {
		for (const [urn, state] of entries(stackState.nodes)) {
			graph.add(urn, dependentsOn(allNodes, urn), async () => {
				if (state.tag === 'resource') {
					await queue(() => deleteResource(appState.idempotentToken!, urn, state, opt))
				}

				// -------------------------------------------------------------------
				// Delete the resource from the stack state

				delete stackState.nodes[urn]
			})
		}
	}

	// -------------------------------------------------------------------
	// Execute deletion graph

	const errors = await graph.run()

	// -------------------------------------------------------------------
	// Process pending deletes from previous failed createBeforeReplace

	if (errors.length === 0 && appState.pendingDeletes) {
		for (const [urn, nodeState] of entries(appState.pendingDeletes)) {
			const stackName = stackNameByNodeUrn.get(urn)
			if (opt.filters?.length && (!stackName || !opt.filters.includes(stackName))) {
				continue
			}

			try {
				await deleteResource(appState.idempotentToken!, urn, nodeState, opt)
				delete appState.pendingDeletes[urn]
			} catch (error) {
				if (error instanceof Error) {
					errors.push(error)
				} else {
					errors.push(new Error(`${error}`))
				}
			}
		}

		if (Object.keys(appState.pendingDeletes).length === 0) {
			delete appState.pendingDeletes
		}
	}

	// -------------------------------------------------------------------
	// Remove empty stacks from app state

	removeEmptyStackStates(appState)

	// -------------------------------------------------------
	// Remove the idempotent token

	delete appState.idempotentToken

	// -------------------------------------------------------
	// Save state

	await opt.backend.state.update(app.urn, appState)

	// -------------------------------------------------------
	if (errors.length > 0) {
		throw new AppError(app.name, [...new Set(errors)], 'Deleting app failed.')
	}

	// -------------------------------------------------------
	// If no errors happened we can savely delete the app
	// state when all the stacks have been deleted.

	if (Object.keys(appState.stacks).length === 0) {
		await opt.backend.state.delete(app.urn)
	}
}

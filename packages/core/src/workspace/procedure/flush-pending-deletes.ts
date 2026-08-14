import { URN } from '../../urn.ts'
import { entries } from '../entries.ts'
import { AppState } from '../state.ts'
import { WorkSpaceOptions } from '../workspace.ts'
import { deleteResource } from './delete-resource.ts'

// The queue holds no dependency information, so a delete can fail
// while the resources depending on it are still queued. Sweep
// repeatedly until a pass deletes nothing, so earlier failures retry
// once their dependents are gone. Only the failures of the final pass
// surface as errors; their entries stay queued for the next run.
export const flushPendingDeletes = async (
	appState: AppState,
	stackNameByNodeUrn: Map<URN, string>,
	opt: WorkSpaceOptions & { filters?: string[] }
) => {
	let progressed = true
	let failures: Error[] = []

	while (progressed && appState.pendingDeletes) {
		progressed = false
		failures = []

		for (const [urn, nodeState] of entries(appState.pendingDeletes)) {
			const stackName = stackNameByNodeUrn.get(urn)
			if (opt.filters?.length && (!stackName || !opt.filters.includes(stackName))) {
				continue
			}

			try {
				await deleteResource(appState.idempotentToken!, urn, nodeState, opt)
				delete appState.pendingDeletes[urn]
				progressed = true
			} catch (error) {
				failures.push(error instanceof Error ? error : new Error(`${error}`))
			}
		}
	}

	if (appState.pendingDeletes && Object.keys(appState.pendingDeletes).length === 0) {
		delete appState.pendingDeletes
	}

	return failures
}

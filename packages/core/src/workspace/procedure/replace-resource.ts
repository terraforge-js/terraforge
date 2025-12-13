import { UUID } from 'node:crypto'
import { createDebugger } from '../../debug.ts'
import { State } from '../../meta.ts'
import { getMeta } from '../../node.ts'
import { findProvider } from '../../provider.ts'
import { Resource } from '../../resource.ts'
import { ResourceError, ResourceNotFound } from '../error.ts'
import { createIdempotantToken } from '../token.ts'
import { WorkSpaceOptions } from '../workspace.ts'

const debug = createDebugger('Replace')

export const replaceResource = async (
	resource: Resource,
	appToken: UUID,
	priorState: State,
	proposedState: State,
	opt: WorkSpaceOptions
): Promise<{
	output: State
	version?: number
}> => {
	const meta = getMeta(resource)
	const urn = meta.urn
	const type = meta.type
	const provider = findProvider(opt.providers, meta.provider)
	const idempotantToken = createIdempotantToken(appToken, meta.urn, 'replace')

	debug(meta.type)
	debug(proposedState)

	if (meta.config?.retainOnDelete) {
		debug('retain', type)
	} else {
		try {
			await provider.deleteResource({
				type,
				state: priorState,
				idempotantToken,
			})
		} catch (error) {
			if (error instanceof ResourceNotFound) {
				// --------------------------------------
				// The resource has already been deleted.
				// Let's skip this issue.
				// --------------------------------------
				debug(type, 'already deleted')
			} else {
				throw ResourceError.wrap(urn, type, 'replace', error)
			}
		}
	}

	let result

	try {
		result = await provider.createResource({
			type,
			state: proposedState,
			idempotantToken,
		})
	} catch (error) {
		throw ResourceError.wrap(urn, type, 'replace', error)
	}

	return {
		version: result.version,
		output: result.state,
	}
}

import { UUID } from 'node:crypto'
import { createDebugger } from '../../debug.ts'
import { State } from '../../meta.ts'
import { getMeta } from '../../node.ts'
import { findProvider } from '../../provider.ts'
import { Resource } from '../../resource.ts'
import { ResourceError } from '../error.ts'
import { NodeState } from '../state.ts'
import { createIdempotantToken } from '../token.ts'
import { WorkSpaceOptions } from '../workspace.ts'

const debug = createDebugger('Create')

export const createResource = async (
	resource: Resource,
	appToken: UUID,
	input: State,
	opt: WorkSpaceOptions
): Promise<Omit<NodeState, 'dependencies' | 'lifecycle'>> => {
	const meta = getMeta(resource)
	const provider = findProvider(opt.providers, meta.provider)
	const idempotantToken = createIdempotantToken(appToken, meta.urn, 'create')

	debug(meta.type)
	debug(input)

	let result

	try {
		result = await provider.createResource({
			type: meta.type,
			state: input,
			idempotantToken,
		})
	} catch (error) {
		// We always need to check if the resource already exists.
		// And restore the state.

		// result = await provider.getResource({
		// 	type: meta.type,
		// 	state: input,
		// })

		// if (!result) {
		// }

		throw ResourceError.wrap(meta.urn, meta.type, 'create', error)
	}

	return {
		tag: 'resource',
		version: result.version,
		type: meta.type,
		provider: meta.provider,
		input: meta.input,
		output: result.state,
	}
}

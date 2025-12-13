import { createDebugger } from '../../debug.ts'
import { State } from '../../meta.ts'
import { getMeta } from '../../node.ts'
import { findProvider } from '../../provider.ts'
import { Resource } from '../../resource.ts'
import { ResourceError } from '../error.ts'
import { NodeState } from '../state.ts'
import { WorkSpaceOptions } from '../workspace.ts'

const debug = createDebugger('Import')

export const importResource = async (
	resource: Resource,
	input: State,
	opt: WorkSpaceOptions
): Promise<Omit<NodeState, 'dependencies' | 'lifecycle'>> => {
	const meta = getMeta(resource)
	const provider = findProvider(opt.providers, meta.provider)

	debug(meta.type)
	debug(input)

	let result

	try {
		result = await provider.getResource({
			type: meta.type,
			state: {
				...input,
				id: meta.config?.import,
			},
		})
	} catch (error) {
		throw ResourceError.wrap(meta.urn, meta.type, 'import', error)
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

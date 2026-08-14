import { createDebugger } from '../../debug.ts'
import { State } from '../../meta.ts'
import { getMeta } from '../../node.ts'
import { findProvider } from '../../provider.ts'
import { Resource } from '../../resource.ts'
import { ResourceError, ResourceNotFound } from '../error.ts'
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
		// The not-found class survives unwrapped, so the create
		// fallback in deploy-app can toggle on it.
		if (error instanceof ResourceNotFound) {
			throw new ResourceNotFound(
				`The "${meta.type}" resource import "${meta.config?.import}" doesn't exist. (${meta.urn})`
			)
		}

		throw ResourceError.wrap(meta.urn, meta.type, 'import', error)
	}

	return {
		tag: 'resource',
		version: result.version,
		type: meta.type,
		provider: meta.provider,
		// Store the resolved input — meta.input contains live Output
		// instances that must never be serialized into state.
		input,
		output: result.state,
	}
}

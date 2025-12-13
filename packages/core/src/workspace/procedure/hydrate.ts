import { App } from '../../app.ts'
import { getMeta } from '../../node.ts'
import { WorkSpaceOptions } from '../workspace.ts'

export const hydrate = async (app: App, opt: WorkSpaceOptions) => {
	const appState = await opt.backend.state.get(app.urn)

	if (appState) {
		for (const stack of app.stacks) {
			const stackState = appState.stacks[stack.urn]

			if (stackState) {
				for (const node of stack.nodes) {
					const meta = getMeta(node)
					const nodeState = stackState.nodes[meta.urn]

					if (nodeState && nodeState.output) {
						meta.resolve(nodeState.output)
					}
				}
			}
		}
	}
}

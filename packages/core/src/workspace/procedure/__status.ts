import { App } from '../../app.ts'
import { findProvider } from '../../provider.ts'
import { compareState } from '../state.ts'
import { WorkSpaceOptions } from '../workspace.ts'

type Status = 'created' | ''

export const status = async (app: App, opt: WorkSpaceOptions) => {
	const appState = await opt.backend.state.get(app.urn)

	app.resources
}

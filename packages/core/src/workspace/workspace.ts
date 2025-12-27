import { UUID } from 'node:crypto'
import { App } from '../app.ts'
import { LockBackend } from '../backend/lock.ts'
import { StateBackend } from '../backend/state.ts'
// import { findInputDeps } from '../input.ts'
import { Provider } from '../provider.ts'
import { Hooks } from './hooks.ts'
import { lockApp } from './lock.ts'
import { deleteApp } from './procedure/delete-app.ts'
import { deployApp } from './procedure/deploy-app.ts'
import { hydrate } from './procedure/hydrate.ts'
import { refresh } from './procedure/refresh.ts'

export type ProcedureOptions = {
	filters?: string[]
	idempotentToken?: UUID
}

export type WorkSpaceOptions = {
	providers: Provider[]
	concurrency?: number
	backend: {
		state: StateBackend
		lock: LockBackend
	}
	hooks?: Hooks
}

export class WorkSpace {
	constructor(protected props: WorkSpaceOptions) {}

	/**
	 * Deploy the entire app or use the filter option to deploy specific stacks inside your app.
	 */
	deploy(app: App, options: ProcedureOptions = {}) {
		return lockApp(this.props.backend.lock, app, async () => {
			try {
				await deployApp(app, { ...this.props, ...options })
			} finally {
				await this.destroyProviders()
			}
		})
	}

	/**
	 * Delete the entire app or use the filter option to delete specific stacks inside your app.
	 */
	delete(app: App, options: ProcedureOptions = {}) {
		return lockApp(this.props.backend.lock, app, async () => {
			try {
				await deleteApp(app, { ...this.props, ...options })
			} finally {
				await this.destroyProviders()
			}
		})
	}

	/**
	 * Hydrate the outputs of the resources & data-sources inside your app.
	 */
	hydrate(app: App) {
		return hydrate(app, this.props)
	}

	/**
	 * Refresh the state of the resources & data-sources inside your app.
	 */
	refresh(app: App) {
		return lockApp(this.props.backend.lock, app, async () => {
			try {
				await refresh(app, this.props)
			} finally {
				await this.destroyProviders()
			}
		})
	}

	protected async destroyProviders() {
		await Promise.all(
			this.props.providers.map(p => {
				return p.destroy?.()
			})
		)
	}
}

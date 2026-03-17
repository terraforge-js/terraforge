import { UUID } from 'node:crypto'
import { App } from '../app.ts'
import { LockBackend } from '../backend/lock.ts'
import { StateBackend } from '../backend/state.ts'
// import { findInputDeps } from '../input.ts'
import { ActivityLogBackend } from '../backend/activity-log.ts'
import { Provider } from '../provider.ts'
import { onExit } from './exit.ts'
import { Hooks } from './hooks.ts'
import { lockApp } from './lock.ts'
import { deleteApp } from './procedure/delete-app.ts'
import { deployApp } from './procedure/deploy-app.ts'
import { hydrate } from './procedure/hydrate.ts'
import { refresh } from './procedure/refresh.ts'
import { status } from './procedure/status.ts'

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
		activityLog?: ActivityLogBackend
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
	async refresh(app: App, options: ProcedureOptions = {}) {
		let releaseLock
		try {
			releaseLock = await this.props.backend.lock.lock(app.urn)
		} catch (error) {
			throw new Error(`Already in progress: ${app.urn}`)
		}

		// --------------------------------------------------
		// Release the lock if we get a TERM signal from
		// the user

		const releaseExit = onExit(async () => {
			await this.destroyProviders()
			await releaseLock()
		})

		// --------------------------------------------------

		try {
			const result = await refresh(app, { ...this.props, ...options })

			if (!result) {
				await this.destroyProviders()
				await releaseLock()
				releaseExit()

				return
			}

			return {
				operations: result.operations,
				commit: async () => {
					await result.commit()
					await this.destroyProviders()
					await releaseLock()
					releaseExit()
				},
			}
		} catch (error) {
			await this.destroyProviders()
			await releaseLock()
			releaseExit()

			throw error
		}
	}

	/**
	 * Get the status of all resources in the app by comparing current config with state file.
	 */
	status(app: App) {
		return status(app, this.props)
	}

	protected async destroyProviders() {
		await Promise.all(
			this.props.providers.map(p => {
				return p.destroy?.()
			})
		)
	}
}

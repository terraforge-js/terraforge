import { UUID } from 'node:crypto'
import { App } from '../app.ts'
import { AlreadyLockedError, LockBackend } from '../backend/lock.ts'
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
			if (error instanceof AlreadyLockedError) {
				throw new Error(`Already in progress: ${app.urn}`)
			}

			// Infrastructure errors must surface as themselves — reporting
			// them as a held lock invites a wrongful insecureReleaseLock.
			throw error
		}

		// --------------------------------------------------
		// Release the lock if we get a TERM signal from
		// the user

		const releaseExit = onExit(async () => {
			await this.destroyProviders()
			await releaseLock()
		})

		// --------------------------------------------------
		// The lock must be released on every path, even when
		// committing the operations fails.

		const cleanup = async () => {
			try {
				await this.destroyProviders()
			} finally {
				await releaseLock()
				releaseExit()
			}
		}

		try {
			const result = await refresh(app, { ...this.props, ...options })

			if (!result) {
				await cleanup()

				return
			}

			return {
				operations: result.operations,
				commit: async () => {
					try {
						await result.commit()
					} finally {
						await cleanup()
					}
				},
				// Release the lock without applying the operations.
				discard: async () => {
					await cleanup()
				},
			}
		} catch (error) {
			await cleanup()

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

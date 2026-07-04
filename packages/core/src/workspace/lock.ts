import { App } from '../app.ts'
import { AlreadyLockedError, LockBackend } from '../backend/lock.ts'
import { onExit } from './exit.ts'

export const lockApp = async <T>(lockBackend: LockBackend, app: App, fn: () => T): Promise<Awaited<T>> => {
	let releaseLock
	try {
		releaseLock = await lockBackend.lock(app.urn)
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
		await releaseLock()
	})

	// --------------------------------------------------
	// Run the callback

	let result: Awaited<T>

	try {
		result = await fn()
	} catch (error) {
		throw error
	} finally {
		await releaseLock()
		releaseExit()
	}

	return result!
}

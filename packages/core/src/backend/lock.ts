import { URN } from '../urn.ts'

// Thrown by lock() only when the lock is genuinely held by someone
// else — infrastructure errors must propagate as themselves.
export class AlreadyLockedError extends Error {
	constructor(readonly urn: URN) {
		super(`Already locked: ${urn}`)
	}
}

export type LockBackend = {
	insecureReleaseLock(urn: URN): Promise<void>
	locked(urn: URN): Promise<boolean>
	lock(urn: URN): Promise<() => Promise<void>>
}

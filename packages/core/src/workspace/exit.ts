// @ts-ignore
import asyncOnExit from 'async-on-exit'

const listeners = new Set<() => Promise<void>>()
let listening = false

// Runs listeners in reverse registration order (LIFO): the last
// registered listener (e.g. a state save inside the lock) must finish
// before earlier ones (e.g. the lock release).
export const flushExitListeners = async () => {
	for (const cb of [...listeners].reverse()) {
		try {
			await cb()
		} catch (error) {}
	}
}

export const onExit = (cb: () => Promise<void>) => {
	listeners.add(cb)

	if (!listening) {
		listening = true
		asyncOnExit(flushExitListeners, true)
	}

	return () => {
		listeners.delete(cb)

		if (listeners.size === 0) {
			listening = false
			asyncOnExit.dispose()
		}
	}
}

// Registers an exit listener for the duration of fn — guaranteed to be
// released on every path, including throws.
export const withOnExit = async <T>(cb: () => Promise<void>, fn: () => Promise<T>): Promise<T> => {
	const release = onExit(cb)

	try {
		return await fn()
	} finally {
		release()
	}
}

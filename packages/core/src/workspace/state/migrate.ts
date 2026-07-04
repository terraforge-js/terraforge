import { StateBackend } from '../../backend/state.ts'
import { URN } from '../../urn.ts'
import { AppState } from '../state.ts'
import { AppStateV0 } from './v0.ts'
import { AppStateV1, v1 } from './v1.ts'
import { v2 } from './v2.ts'

const versions = [
	[1, v1],
	[2, v2],
] as const

export const migrateAppState = (oldState: AppStateV1 | AppStateV0 | AppState): AppState => {
	const version = ('version' in oldState && oldState.version) || 0

	for (const [v, migrate] of versions) {
		if (v > version) {
			oldState = migrate(oldState as any)
		}
	}

	return oldState as AppState
}

export const getMigratedAppState = async (backend: StateBackend, urn: URN) => {
	const state = await backend.get(urn)
	return state ? migrateAppState(state) : undefined
}

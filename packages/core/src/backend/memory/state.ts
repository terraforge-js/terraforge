import { URN } from '../../urn.ts'
import { AppState } from '../../workspace/state.ts'
import { StateBackend } from '../state.ts'

export class MemoryStateBackend implements StateBackend {
	protected states = new Map<URN, AppState>()

	async get(urn: URN) {
		const state = this.states.get(urn)
		return state ? structuredClone(state) : undefined
	}

	async update(urn: URN, state: AppState) {
		// Store a snapshot — the file and S3 backends serialize to JSON, so
		// callers' later mutations must not alias the persisted state.
		this.states.set(urn, structuredClone(state))
	}

	async delete(urn: URN) {
		this.states.delete(urn)
	}

	clear() {
		this.states.clear()
	}
}

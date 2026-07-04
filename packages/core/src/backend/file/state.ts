import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createDebugger } from '../../debug.ts'
import { URN } from '../../urn.ts'
import { AppState } from '../../workspace/state.ts'
import { StateBackend } from '../state.ts'

const debug = createDebugger('State')

export class FileStateBackend implements StateBackend {
	constructor(
		private props: {
			dir: string
		}
	) {}

	private stateFile(urn: URN) {
		return join(this.props.dir, `${urn}.state.json`)
	}

	private async mkdir() {
		await mkdir(this.props.dir, {
			recursive: true,
		})
	}

	async get(urn: URN) {
		debug('get')

		let json

		try {
			json = await readFile(this.stateFile(urn), 'utf8')
		} catch (error) {
			// Only a missing file means "no state". Any other error must fail
			// loudly — treating it as undeployed would recreate every resource
			// and overwrite the real state file.
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return
			}

			throw error
		}

		return JSON.parse(json) as AppState
	}

	async update(urn: URN, state: AppState) {
		debug('update')
		await this.mkdir()

		// Write to a temp file and rename it into place so a crash mid-write
		// can't leave a truncated state file behind.
		const file = this.stateFile(urn)
		const temp = `${file}.tmp`

		await writeFile(temp, JSON.stringify(state, undefined, 2))
		await rename(temp, file)
	}

	async delete(urn: URN) {
		debug('delete')
		await this.mkdir()
		await rm(this.stateFile(urn))
	}
}

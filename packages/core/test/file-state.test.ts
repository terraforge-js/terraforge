import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URN } from '../src'
import { FileStateBackend } from '../src/backend/file/state'
import { AppState } from '../src/workspace/state'

describe('file state backend', () => {
	const urn = 'urn:app:{test}' as URN
	const state: AppState = {
		name: 'test',
		version: 2,
		stacks: {},
	}

	let dir: string
	let backend: FileStateBackend

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'terraforge-state-'))
		backend = new FileStateBackend({ dir })
	})

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	it('should return undefined for a missing state file', async () => {
		expect(await backend.get(urn)).toBeUndefined()
	})

	it('should round trip the app state without leaving a temp file', async () => {
		await backend.update(urn, state)

		expect(await backend.get(urn)).toEqual(state)

		const files = await readdir(dir)
		expect(files.filter(file => file.endsWith('.tmp'))).toEqual([])
	})

	it('should throw on read errors other than a missing file', async () => {
		const brokenUrn = 'urn:app:{broken}' as URN

		// A directory at the state file path fails with EISDIR, not ENOENT.
		await mkdir(join(dir, `${brokenUrn}.state.json`))

		await expect(backend.get(brokenUrn)).rejects.toThrow()
	})

	it('should delete the state file', async () => {
		await backend.delete(urn)

		expect(await backend.get(urn)).toBeUndefined()
	})
})

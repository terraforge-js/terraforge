import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URN } from '../src'
import { FileLockBackend } from '../src/backend/file/lock'

describe('file lock backend', () => {
	const urn = 'urn:app:{test}' as URN
	let dir: string
	let backend: FileLockBackend

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'terraforge-lock-'))
		backend = new FileLockBackend({ dir })
	})

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	it('should report unlocked for a never locked urn', async () => {
		expect(await backend.locked(urn)).toBe(false)
	})

	it('should report locked while a lock is held and unlocked after release', async () => {
		const release = await backend.lock(urn)

		expect(await backend.locked(urn)).toBe(true)

		await release()

		expect(await backend.locked(urn)).toBe(false)
	})

	it('should force release a lock that was never released', async () => {
		await backend.lock(urn)

		expect(await backend.locked(urn)).toBe(true)

		await backend.insecureReleaseLock(urn)

		expect(await backend.locked(urn)).toBe(false)

		// The urn must be lockable again.
		const release = await backend.lock(urn)
		await release()
	})
})

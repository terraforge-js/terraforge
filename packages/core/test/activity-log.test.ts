import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URN } from '../src'
import { ActivityLogBackend } from '../src/backend/activity-log'
import { FileActivityLogBackend } from '../src/backend/file/activity-log'
import { MemoryActivityLogBackend } from '../src/backend/memory/activity-log'

describe('activity log backends', () => {
	const urn = 'urn:app:{test}' as URN

	let dir: string
	let backends: Array<[string, ActivityLogBackend]>

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'terraforge-activity-'))
		backends = [
			['memory', new MemoryActivityLogBackend()],
			['file', new FileActivityLogBackend({ dir })],
		]
	})

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	it('tail should return an empty list for a never logged urn', async () => {
		for (const [, backend] of backends) {
			expect(await backend.tail('urn:app:{never}' as URN)).toEqual([])
		}
	})

	it('tail should return the most recent entries, newest first', async () => {
		for (const [name, backend] of backends) {
			await backend.log(urn, { action: 'deploy', filters: ['a'] })
			await backend.log(urn, { action: 'deploy', filters: ['b'] })
			await backend.log(urn, { action: 'delete', filters: ['c'] })

			const logs = await backend.tail(urn, 2)

			expect(logs.map(log => log.filters?.[0])).toEqual(['c', 'b'])
			expect(logs.map(() => name).length).toBe(2)
		}
	})
})

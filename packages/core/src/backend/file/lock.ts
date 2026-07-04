import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { check, lock, unlock } from 'proper-lockfile'
import { URN } from '../../urn.ts'
import { AlreadyLockedError, LockBackend } from '../lock.ts'

export class FileLockBackend implements LockBackend {
	constructor(
		private props: {
			dir: string
		}
	) {}

	private lockFile(urn: URN) {
		return join(this.props.dir, `${urn}.lock`)
	}

	private async mkdir() {
		await mkdir(this.props.dir, {
			recursive: true,
		})
	}

	async insecureReleaseLock(urn: URN) {
		if (await this.locked(urn)) {
			await unlock(this.lockFile(urn), {
				realpath: false,
			})
		}
	}

	async locked(urn: URN) {
		return check(this.lockFile(urn), {
			realpath: false,
		})
	}

	async lock(urn: URN) {
		await this.mkdir()

		try {
			return await lock(this.lockFile(urn), {
				realpath: false,
			})
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ELOCKED') {
				throw new AlreadyLockedError(urn)
			}

			throw error
		}
	}
}

import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { URN } from '../../urn.ts'
import { ActivityLogBackend, Log, LogProps } from '../activity-log.ts'

type Props = {
	user?: string
	dir: string
}

export class FileActivityLogBackend implements ActivityLogBackend {
	constructor(private props: Props) {}

	private logFile(urn: URN) {
		return join(this.props.dir, `${urn}.log.jsonl`)
	}

	private async mkdir() {
		await mkdir(this.props.dir, {
			recursive: true,
		})
	}

	async log(urn: URN, log: LogProps) {
		const json = JSON.stringify({
			user: this.props.user,
			date: Date.now(),
			...log,
		})

		await this.mkdir()
		await appendFile(this.logFile(urn), `${json}\n`)
	}

	async tail(urn: URN, limit = 10) {
		let content

		try {
			content = await readFile(this.logFile(urn), 'utf8')
		} catch (error) {
			// No log file means no activity yet.
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return []
			}

			throw error
		}

		const lines = content.split('\n').filter(Boolean)
		return lines
			.slice(-limit)
			.map(line => JSON.parse(line) as Log)
			.reverse()
	}
}

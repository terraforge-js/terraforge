import { appendFile, mkdir, readFile, stat } from 'node:fs/promises'
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
		const file = this.logFile(urn)
		const stats = await stat(file)

		if (!stats.isFile()) {
			return []
		}

		const content = await readFile(file, 'utf8')
		const lines = content.split('\n').filter(Boolean)
		return lines.slice(-limit).map(line => JSON.parse(line) as Log)
	}
}

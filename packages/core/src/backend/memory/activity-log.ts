import { URN } from '../../urn.ts'
import { ActivityLogBackend, Log, LogProps } from '../activity-log.ts'

type Props = {
	user?: string
}

export class MemoryActivityLogBackend implements ActivityLogBackend {
	protected groups = new Map<URN, Log[]>()

	constructor(private props: Props = {}) {}

	async log(urn: URN, log: LogProps) {
		this.getLogGroup(urn).push({
			user: this.props.user,
			date: Date.now(),
			...log,
		})
	}

	private getLogGroup(urn: URN): Log[] {
		if (!this.groups.has(urn)) {
			this.groups.set(urn, [])
		}

		return this.groups.get(urn)!
	}

	async tail(urn: URN, limit = 10) {
		return this.getLogGroup(urn).slice(-limit)
	}
}

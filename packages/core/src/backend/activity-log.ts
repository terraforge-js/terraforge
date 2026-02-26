import { URN } from '../urn.ts'

export type LogProps = {
	action: 'deploy' | 'delete'
	filters?: string[]
}

export type Log = LogProps & {
	user?: string
	date?: number
}

export type ActivityLogBackend = {
	log(urn: URN, log: LogProps): Promise<void>
	tail(urn: URN): Promise<Log[]>
}

export type DebugSink = (group: string, ...args: unknown[]) => void

const consoleSink: DebugSink = (group, ...args) => {
	console.log()
	console.log(`${group}:`, ...args)
	console.log()
}

let sink: DebugSink | undefined

export const enableDebug = (customSink?: DebugSink) => {
	sink = customSink ?? consoleSink
}

export const disableDebug = () => {
	sink = undefined
}

export const createDebugger = (group: string) => {
	return (...args: unknown[]) => {
		sink?.(group, ...args)
	}
}

import type { Property, RootProperty } from '../schema.ts'

export type State = Record<string, unknown>

export type Plugin = Readonly<{
	schema: () => {
		provider: Property
		resources: Record<string, RootProperty>
		dataSources: Record<string, RootProperty>
	}
	stop: () => Promise<void>
	configure: (config: State) => Promise<void>
	readResource: (type: string, state: State) => Promise<State>
	readDataSource: (type: string, state: State) => Promise<State>
	validateResource: (type: string, state: State) => Promise<void>
	planResourceChange: (
		type: string,
		priorState: State | null,
		proposedNewState: State | null,
		configState: State | null
	) => Promise<{
		requiresReplace: Array<string | number>[]
		plannedState: State
		// The untouched DynamicValue from the provider. Decoding loses the
		// "unknown" markers (msgpack ext 0), so apply must send this back
		// verbatim instead of re-encoding the decoded planned state.
		rawPlannedState?: unknown
	}>
	applyResourceChange: (
		type: string,
		priorState: State | null,
		plannedState: State | null,
		configState: State | null,
		rawPlannedState?: unknown
	) => Promise<State>
}>

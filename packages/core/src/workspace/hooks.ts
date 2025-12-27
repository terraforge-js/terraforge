import { State } from '../meta'
import { Resource } from '../resource'
import { URN } from '../urn'

type ResourceEvent = {
	urn: URN
	type: string
}

export type BeforeResourceCreateEvent = ResourceEvent & {
	resource: Resource
	newInput: State
}

export type AfterResourceCreateEvent = ResourceEvent & {
	resource: Resource
	newInput: State
	newOutput: State
}

export type BeforeResourceUpdateEvent = ResourceEvent & {
	resource: Resource
	oldInput: State
	newInput: State
	oldOutput: State
}

export type AfterResourceUpdateEvent = ResourceEvent & {
	resource: Resource
	oldInput: State
	newInput: State
	oldOutput: State
	newOutput: State
}

export type BeforeResourceDeleteEvent = ResourceEvent & {
	oldInput: State
	oldOutput: State
}

export type AfterResourceDeleteEvent = ResourceEvent & {
	oldInput: State
	oldOutput: State
}

export type Hooks = {
	beforeResourceCreate?: (event: BeforeResourceCreateEvent) => Promise<void> | void
	beforeResourceUpdate?: (event: BeforeResourceUpdateEvent) => Promise<void> | void
	beforeResourceDelete?: (event: BeforeResourceDeleteEvent) => Promise<void> | void

	afterResourceCreate?: (event: AfterResourceCreateEvent) => Promise<void> | void
	afterResourceUpdate?: (event: AfterResourceUpdateEvent) => Promise<void> | void
	afterResourceDelete?: (event: AfterResourceDeleteEvent) => Promise<void> | void
}

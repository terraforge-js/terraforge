import { DataSource, DataSourceMeta } from './data-source.ts'
import type { Config, Meta, State, Tag } from './meta.ts'
import { Resource, ResourceMeta } from './resource.ts'
import { URN } from './urn.ts'

export const nodeMetaSymbol = Symbol('metadata')

export type Node<T extends Tag = Tag, I extends State = State, O extends State = any, C extends Config = Config> = {
	readonly [nodeMetaSymbol]: Meta<T, I, O, C>
	readonly urn: URN
} & O

export const isNode = (obj: object): obj is { [nodeMetaSymbol]: Meta } => {
	const meta = (obj as any)[nodeMetaSymbol]
	return meta && typeof meta === 'object' && meta !== null && 'tag' in meta && typeof meta.tag === 'string'
}

export function getMeta(node: Resource): ResourceMeta
export function getMeta(node: DataSource): DataSourceMeta
export function getMeta(node: Node): Meta
export function getMeta(node: Node): Meta {
	return node[nodeMetaSymbol]
}

export const isResource = (obj: object): obj is Resource => {
	return isNode(obj) && obj[nodeMetaSymbol].tag === 'resource'
}

export const isDataSource = (obj: object): obj is DataSource => {
	return isNode(obj) && obj[nodeMetaSymbol].tag === 'data'
}

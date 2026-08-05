type Block = {
	version?: number
	attributes?: Attribute[]
	blockTypes?: NestedBlock[]
	description?: string
	deprecated?: boolean
}

type Attribute = {
	name: string
	type?: Buffer
	nestedType?: {
		attributes: Attribute[]
		nesting?: number
	}
	description?: string
	required?: boolean
	optional?: boolean
	computed?: boolean
	sensitive?: boolean
	deprecated?: boolean
}

type ParsedAttributeType = string | [string, Record<string, ParsedAttributeType> | ParsedAttributeType]

const NestingMode = {
	INVALID: 0,
	SINGLE: 1,
	LIST: 2,
	SET: 3,
	MAP: 4,
	GROUP: 5,
} as const

type NestedBlock = {
	typeName: string
	block: Block
	nesting: number

	/** deprecated */
	minItems?: Long

	/** deprecated */
	maxItems?: Long
}

type Schema = {
	version?: number
	block?: Block
}

export type RootProperty = {
	type: 'object'
	version?: number
	description?: string
	properties: Record<string, Property>
}

// export type SchemaProperty = {
//   description?: string;
//   required?: boolean;
//   optional?: boolean;
//   /** The computed field means that it could be computed by the server. */
//   computed?: boolean;
//   deprecated?: boolean;
//   sensitive?: boolean;
// } & (
//   | {
//       type: "string" | "number" | "boolean";
//     }
//   | {
//       type: "array" | "record";
//       item: Property;
//     }
//   | {
//       type: "object";
//       properties: Record<string, Property>;
//     }
//   | {
//       type: "unknown";
//     }
// );

export type Property = {
	description?: string
	required?: boolean
	optional?: boolean
	/** The computed field means that it could be computed by the server. */
	computed?: boolean
	deprecated?: boolean
	sensitive?: boolean
	/**
	 * True when the property comes from a nested block. Terraform never
	 * sends null blocks to providers — absent blocks are encoded as empty
	 * collections, and provider code relies on that invariant.
	 */
	block?: boolean
} & (
	| {
			type: 'string' | 'number' | 'boolean'
	  }
	| {
			type: 'array' | 'record'
			item: Property
			collectionKind?: 'list' | 'set'
	  }
	| {
			type: 'object' | 'array-object'
			properties: Record<string, Property>
	  }
	| {
			type: 'unknown'
	  }
)

export const parseResourceSchema = (schemas: Record<string, Schema>) => {
	const props: Record<string, RootProperty> = {}

	for (const [name, schema] of Object.entries(schemas)) {
		if (schema.block) {
			const block = parseBlock(schema.block)

			props[name] = {
				...block,
				version: block.version ?? schema.version,
			}
		}
	}

	return props
}

export const parseProviderSchema = (schema: Schema): RootProperty => {
	if (schema.block) {
		const block = parseBlock(schema.block)

		return {
			...block,
			version: block.version ?? schema.version,
		}
	}

	throw new Error('Invalid block')
}

export const parseBlock = (block: Block): RootProperty => {
	const properties: Record<string, Property> = {}

	for (const entry of block.attributes ?? []) {
		properties[entry.name] = parseAttribute(entry)
	}

	for (const entry of block.blockTypes ?? []) {
		properties[entry.typeName] = parseNestedBlock(entry)
	}

	if (block.deprecated) {
		console.warn('Deprecated block')
	}

	return {
		type: 'object',
		version: block.version,
		description: block.description,
		// deprecated: block.deprecated,
		properties,
	}
}

export const parseNestedBlock = (block: NestedBlock): Property => {
	const type = parseNestedBlockType(block)
	const item = parseBlock(block.block)
	const prop = {
		optional: true,
		required: false,
		computed: false,
	}

	if (type === 'array' || type === 'record') {
		return {
			...prop,
			type,
			item,
			block: true,
			collectionKind: block.nesting === NestingMode.SET ? 'set' : 'list',
		}
	}

	if (type === 'array-object') {
		return {
			...prop,
			...item,
			type,
			block: true,
		}
	}

	return {
		...prop,
		...item,
	}
}

export const parseNestedBlockType = (block: NestedBlock) => {
	if (block.nesting === NestingMode.SET) {
		return 'array'
	}

	if (block.nesting === NestingMode.LIST) {
		if (block.maxItems?.eq(1)) {
			return 'array-object'
		}

		return 'array'
	}

	if (block.nesting === NestingMode.MAP) {
		return 'record'
	}

	if (block.nesting === NestingMode.GROUP) {
		return 'object'
	}

	if (block.nesting === NestingMode.SINGLE) {
		return 'object'
	}

	throw new Error(`Invalid nested block type ${block.nesting}`)
}

export const parseAttribute = (attr: Attribute): Property => {
	const prop = {
		description: attr.description,
		required: attr.required,
		optional: attr.optional,
		computed: attr.computed,
		deprecated: attr.deprecated,
		sensitive: attr.sensitive,
	}

	if (attr.type) {
		const json = JSON.parse(attr.type.toString('utf8'))
		return {
			...prop,
			...parseAttributeType(json),
		}
	}

	if (attr.nestedType) {
		const block = parseBlock(attr.nestedType)
		const nesting = attr.nestedType.nesting

		if (nesting === NestingMode.LIST || nesting === NestingMode.SET) {
			return {
				...prop,
				type: 'array',
				item: block,
				collectionKind: nesting === NestingMode.SET ? 'set' : 'list',
			}
		}

		if (nesting === NestingMode.MAP) {
			return {
				...prop,
				type: 'record',
				item: block,
			}
		}

		// SINGLE (or unspecified) — a single nested object.
		return {
			...prop,
			...block,
		}
	}

	throw new Error('Empty attr')
}

export const parseAttributeType = (item: ParsedAttributeType): Property => {
	if (Array.isArray(item)) {
		const sourceType = item[0]
		const type = parseType(sourceType)

		if (type === 'array' || (type === 'record' && item)) {
			const record = item[1] as ParsedAttributeType
			return {
				type,
				item: parseAttributeType(record),
				collectionKind: sourceType === 'set' ? 'set' : 'list',
			}
		}

		if (type === 'object') {
			const object = item[1] as Record<string, ParsedAttributeType>
			const properties: Record<string, Property> = {}
			for (const [name, prop] of Object.entries(object)) {
				properties[name] = parseAttributeType(prop)
			}
			return {
				type,
				properties,
			}
		}

		throw new Error('Invalid attribute type')
	}

	const type = parseType(item)

	if (isLeafType(type)) {
		return {
			type,
		}
	}

	// if (type === "unknown") {
	//   return {
	//     type,
	//   };
	// }

	throw new Error(`Invalid attribute type`)
}

const isLeafType = (type: string): type is 'string' | 'number' | 'boolean' | 'unknown' => {
	return ['string', 'number', 'boolean', 'unknown'].includes(type)
}

const parseType = (type: string) => {
	if (type === 'string') {
		return 'string'
	}

	if (type === 'number') {
		return 'number'
	}

	if (type === 'bool') {
		return 'boolean'
	}

	if (['set', 'list'].includes(type)) {
		return 'array'
	}

	if (type === 'object') {
		return 'object'
	}

	if (type === 'map') {
		return 'record'
	}

	if (type === 'dynamic') {
		return 'unknown'
	}

	throw new Error(`Invalid type: ${type}`)
}

import { parseAttribute } from '../src/plugin/schema'

describe('parseAttribute nested types', () => {
	const nestedType = (nesting?: number) => ({
		name: 'rule',
		optional: true,
		nestedType: {
			nesting,
			attributes: [
				{
					name: 'value',
					type: Buffer.from(JSON.stringify('string')),
					optional: true,
				},
			],
		},
	})

	const itemSchema = {
		type: 'object',
		properties: {
			value: expect.objectContaining({ type: 'string' }),
		},
	}

	it('should parse a list nested attribute as an array', () => {
		expect(parseAttribute(nestedType(2))).toMatchObject({
			type: 'array',
			collectionKind: 'list',
			item: itemSchema,
		})
	})

	it('should parse a set nested attribute as an array', () => {
		expect(parseAttribute(nestedType(3))).toMatchObject({
			type: 'array',
			collectionKind: 'set',
			item: itemSchema,
		})
	})

	it('should parse a map nested attribute as a record', () => {
		expect(parseAttribute(nestedType(4))).toMatchObject({
			type: 'record',
			item: itemSchema,
		})
	})

	it('should parse a single nested attribute as an object', () => {
		expect(parseAttribute(nestedType(1))).toMatchObject(itemSchema)
		expect(parseAttribute(nestedType(undefined))).toMatchObject(itemSchema)
	})
})

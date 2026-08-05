import { camelCase, snakeCase } from 'change-case'
import { pack, unpack } from 'msgpackr'
import { Property, RootProperty } from '../schema.ts'

export const stableStringify = (value: unknown): string => {
	return JSON.stringify(value, (_, item) => {
		if (item !== null && item instanceof Object && !Array.isArray(item)) {
			return Object.keys(item)
				.sort()
				.reduce((sorted: Record<string, unknown>, key) => {
					sorted[key] = item[key as keyof typeof item]
					return sorted
				}, {})
		}

		return item
	})
}

const sortStateValues = (values: unknown[]) => {
	return [...values].sort((left, right) => {
		const l = stableStringify(left)
		const r = stableStringify(right)

		if (l < r) return -1
		if (l > r) return 1
		return 0
	})
}

const tryNormalizeJsonString = (value: string) => {
	const trimmed = value.trim()

	if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
		return value
	}

	try {
		return stableStringify(JSON.parse(trimmed))
	} catch {
		return value
	}
}

const uniqueStateValues = (values: unknown[]) => {
	const seen = new Set<string>()

	return values.filter(value => {
		const key = stableStringify(value)
		if (seen.has(key)) {
			return false
		}

		seen.add(key)
		return true
	})
}

export const encodeDynamicValue = (value: unknown) => {
	return {
		msgpack: pack(value),
		json: value,
	}
}

export const decodeDynamicValue = (value: { msgpack: Buffer }) => {
	return unpack(value.msgpack)
}

export const getResourceSchema = (resources: Record<string, RootProperty>, type: string) => {
	const resource = resources[type]

	if (!resource) {
		throw new Error(`Unknown resource type: ${type}`)
	}

	return resource
}

// export const prepareEmptyState = (schema: Property) => {
// 	if (schema.type !== 'object') {
// 		return {}
// 	}

// 	const empty: Record<string, null> = {}

// 	for (const name of Object.keys(schema.properties)) {
// 		empty[name] = null
// 	}

// 	return empty
// }

type AttributePath = {
	steps: Array<
		| {
				attributeName: string
		  }
		| {
				elementKeyString: string
		  }
		| {
				elementKeyInt: number
		  }
	>
}

export const formatAttributePath = (state?: AttributePath[]): Array<number | string>[] => {
	if (!state) {
		return []
	}

	return state.map(item => {
		if (!item.steps) {
			throw new Error('AttributePath should always have steps')
		}

		return item.steps.map(attr => {
			if ('attributeName' in attr) {
				return attr.attributeName
			}

			if ('elementKeyString' in attr) {
				return attr.elementKeyString
			}

			if ('elementKeyInt' in attr) {
				return attr.elementKeyInt
			}

			throw new Error('AttributePath step should always have an element')
		})
	})
}

const getNestedValue = (obj: Record<string, unknown>, path: Array<string | number>): unknown => {
	let current: unknown = obj
	for (const key of path) {
		if (current === null || current === undefined) return current
		if (Array.isArray(current)) {
			current = current[key as number]
		} else if (typeof current === 'object') {
			current = (current as Record<string, unknown>)[key as string]
		} else {
			return undefined
		}
	}
	return current
}

export const filterRequiresReplace = (
	paths: Array<Array<string | number>>,
	priorState: Record<string, unknown>,
	proposedState: Record<string, unknown>
): Array<Array<string | number>> => {
	return paths.filter(path => {
		const priorValue = getNestedValue(priorState, path)
		const proposedValue = getNestedValue(proposedState, path)
		return JSON.stringify(priorValue) !== JSON.stringify(proposedValue)
	})
}

class IncorrectType extends TypeError {
	constructor(type: string, path: Array<string | number>) {
		super(`${path.join('.')} should be a ${type}`)
	}
}

const isEmptyOutputValue = (value: unknown): boolean => {
	if (value === null || typeof value === 'undefined') {
		return true
	}

	if (Array.isArray(value)) {
		return value.length === 0
	}

	if (typeof value === 'object') {
		return Object.keys(value).length === 0
	}

	return false
}

const shouldOmitOutputValue = (schema: Property, value: unknown) => {
	if (!(schema.optional || schema.computed)) {
		return false
	}

	return isEmptyOutputValue(value)
}

const hasInputValue = (value: unknown) => typeof value !== 'undefined'

const shouldIncludeFieldForComparison = (schema: Property, inputValue: unknown) => {
	return schema.required || hasInputValue(inputValue)
}

const isContainerSchema = (schema: Property) => {
	return ['array', 'record', 'object', 'array-object'].includes(schema.type)
}

const isEmptyStructuralInput = (value: unknown): boolean => {
	if (value === null || typeof value === 'undefined') {
		return true
	}

	if (Array.isArray(value)) {
		return value.length === 0 || value.every(item => isEmptyStructuralInput(item))
	}

	if (typeof value === 'object') {
		const entries = Object.values(value)
		return entries.length === 0 || entries.every(item => isEmptyStructuralInput(item))
	}

	return false
}

export const normalizeStateForComparison = (
	schema: Property,
	state: unknown,
	inputState?: unknown,
	allowStructuralFallback: boolean = true
): unknown => {
	if (!shouldIncludeFieldForComparison(schema, inputState)) {
		return undefined
	}

	if (
		allowStructuralFallback &&
		(state === null || typeof state === 'undefined') &&
		isContainerSchema(schema) &&
		isEmptyStructuralInput(inputState)
	) {
		state = inputState
	}

	if (state === null || typeof state === 'undefined') {
		return state
	}

	if (schema.type === 'array') {
		if (!Array.isArray(state)) {
			return state
		}

		const normalized = state.map((item, index) => {
			const inputItem = Array.isArray(inputState) ? inputState[index] : undefined
			return normalizeStateForComparison(schema.item, item, inputItem, allowStructuralFallback)
		})
		const filtered = normalized.filter(item => typeof item !== 'undefined')

		if (schema.collectionKind === 'set') {
			return sortStateValues(uniqueStateValues(filtered.filter(item => item !== null)))
		}

		return filtered
	}

	if (schema.type === 'record') {
		if (typeof state !== 'object' || state === null) {
			return state
		}

		return Object.fromEntries(
			Object.entries(state).flatMap(([key, value]) => {
				const inputValue =
					inputState && typeof inputState === 'object' ? (inputState as Record<string, unknown>)[key] : undefined
				const normalized = normalizeStateForComparison(schema.item, value, inputValue, allowStructuralFallback)

				if (typeof normalized === 'undefined') {
					return []
				}

				return [[key, normalized] as const]
			})
		)
	}

	if (schema.type === 'object') {
		if (typeof state !== 'object' || state === null) {
			return state
		}

		const normalized = Object.fromEntries(
			Object.entries(schema.properties)
				.flatMap(([key, prop]) => {
					const stateValue = (state as Record<string, unknown>)[camelCase(key)]
					const inputValue =
						inputState && typeof inputState === 'object'
							? (inputState as Record<string, unknown>)[camelCase(key)]
							: undefined
					const normalized = normalizeStateForComparison(prop, stateValue, inputValue, allowStructuralFallback)

					if (typeof normalized === 'undefined') {
						return []
					}

					return [[camelCase(key), normalized] as const]
				})
		)

		if (allowStructuralFallback && Object.keys(normalized).length === 0 && isEmptyStructuralInput(inputState)) {
			return normalizeStateForComparison(schema, inputState, inputState, false)
		}

		return normalized
	}

	if (schema.type === 'array-object') {
		if (typeof state !== 'object' || state === null) {
			return state
		}

		const normalized = Object.fromEntries(
			Object.entries(schema.properties)
				.flatMap(([key, prop]) => {
					const stateValue = (state as Record<string, unknown>)[camelCase(key)]
					const inputValue =
						inputState && typeof inputState === 'object'
							? (inputState as Record<string, unknown>)[camelCase(key)]
							: undefined
					const normalized = normalizeStateForComparison(prop, stateValue, inputValue, allowStructuralFallback)

					if (typeof normalized === 'undefined') {
						return []
					}

					return [[camelCase(key), normalized] as const]
				})
		)

		if (allowStructuralFallback && Object.keys(normalized).length === 0 && isEmptyStructuralInput(inputState)) {
			return normalizeStateForComparison(schema, inputState, inputState, false)
		}

		return normalized
	}

	if (schema.type === 'string') {
		if (typeof state === 'string') {
			return tryNormalizeJsonString(state)
		}
	}

	return state
}

export const formatInputState = (
	schema: Property,
	state: unknown,
	includeSchemaFields: boolean = true,
	path: Array<string | number> = []
): unknown => {
	// console.log(path, state, schema)

	if (state === null || typeof state === 'undefined') {
		// Terraform never sends null blocks to providers — absent blocks
		// are encoded as empty collections, and provider code relies on
		// that invariant (a null trips IsKnown-only guards and panics).
		if (schema.block) {
			if (schema.type === 'array' || schema.type === 'array-object') {
				return []
			}

			if (schema.type === 'record') {
				return {}
			}
		}

		return null
	}

	if (schema.type === 'unknown') {
		return state
	}

	if (schema.type === 'string') {
		if (typeof state === 'string') {
			return state
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'number') {
		if (typeof state === 'number') {
			return state
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'boolean') {
		if (typeof state === 'boolean') {
			return state
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'array') {
		if (Array.isArray(state)) {
			return state.map((item, i) => formatInputState(schema.item, item, includeSchemaFields, [...path, i]))
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'record') {
		if (typeof state === 'object' && state !== null) {
			const record: Record<string, unknown> = {}

			for (const [key, value] of Object.entries(state)) {
				record[key] = formatInputState(schema.item, value, includeSchemaFields, [...path, key])
			}

			return record
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'object' || schema.type === 'array-object') {
		if (typeof state === 'object' && state !== null) {
			const object: Record<string, unknown> = {}

			if (includeSchemaFields) {
				for (const [key, prop] of Object.entries(schema.properties)) {
					const value = state[camelCase(key) as keyof typeof state]
					object[key] = formatInputState(prop, value, true, [...path, key])
				}
			} else {
				for (const [key, value] of Object.entries(state)) {
					const prop = schema.properties[snakeCase(key)]
					if (prop) {
						object[key] = formatInputState(prop, value, false, [...path, key])
					}
				}
			}

			if (schema.type === 'array-object') {
				return [object]
			}

			return object
		}

		throw new IncorrectType(schema.type, path)
	}

	// if (schema.type === 'array-object') {
	// 	if (typeof state === 'object' && state !== null) {
	// 		const object: Record<string, unknown> = {}

	// 		for (const [key, prop] of Object.entries(schema.properties)) {
	// 			const value = state[camelCase(key) as keyof typeof state]
	// 			object[key] = formatInputState(prop, value, [...path, key])
	// 		}

	// 		return [object]
	// 	}

	// 	throw new IncorrectType(schema.type, path)
	// }

	throw new Error(`Unknown schema type: ${schema.type}`)
}

export const formatOutputState = (schema: Property, state: unknown, path: Array<string | number> = []): any => {
	if (state === null || state === undefined) {
		return null
	}

	if (schema.type === 'array') {
		if (Array.isArray(state)) {
			return state.map((item, i) => formatOutputState(schema.item, item, [...path, i]))
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'record') {
		if (typeof state === 'object' && state !== null) {
			const record: Record<string, unknown> = {}

			for (const [key, value] of Object.entries(state)) {
				record[key] = formatOutputState(schema.item, value, [...path, key])
			}

			return record
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'object') {
		if (typeof state === 'object' && state !== null) {
			const object: Record<string, unknown> = {}

			for (const [key, prop] of Object.entries(schema.properties)) {
				const value = state[key as keyof typeof state]
				const formatted = formatOutputState(prop, value, [...path, key])

				if (shouldOmitOutputValue(prop, formatted)) {
					continue
				}

				object[camelCase(key)] = formatted
			}

			return object
		}

		throw new IncorrectType(schema.type, path)
	}

	if (schema.type === 'array-object') {
		if (Array.isArray(state)) {
			if (state.length === 1) {
				const object: Record<string, unknown> = {}

				for (const [key, prop] of Object.entries(schema.properties)) {
					const value = state[0][key as keyof typeof state]
					const formatted = formatOutputState(prop, value, [...path, key])

					if (shouldOmitOutputValue(prop, formatted)) {
						continue
					}

					object[camelCase(key)] = formatted
				}

				return object
			} else {
				return null
			}
		}

		throw new IncorrectType(schema.type, path)
	}

	return state
}

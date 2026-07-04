import { requiresReplacement } from '../src/workspace/replacement'

describe('requiresReplacement util', () => {
	const left = {
		id: 1,
		key: 1,
		list: [{ key: 1 }, { key: 2 }],
	}

	const right = {
		id: 1,
		key: 2,
		list: [{ key: 1 }, { key: 3 }],
	}

	it('valid replacements', () => {
		const valid = [
			// valid
			['key'],
			['key', 'unknown'],
			['list[1].key'],
			['list.1.key'],
			['list.*.key'],
		]

		for (const paths of valid) {
			expect(requiresReplacement(left, right, paths)).toBe(true)
		}
	})

	it('invalid replacements', () => {
		const invalid = [
			// invalid
			['id'],
			['unknown'],
			['list[0].key'],
			['list[999].key'],
		]

		for (const paths of invalid) {
			expect(requiresReplacement(left, right, paths)).toBe(false)
		}
	})

	it('wildcard paths should handle a removed array', () => {
		// The whole array was removed from the proposed state — that's a
		// change, not a crash.
		expect(requiresReplacement(left, { id: 1, key: 1 }, ['list.*.key'])).toBe(true)
	})

	it('wildcard paths should handle an added array', () => {
		expect(requiresReplacement({ id: 1, key: 1 }, left, ['list.*.key'])).toBe(true)
	})

	it('wildcard paths should handle added elements', () => {
		const extended = {
			...left,
			list: [...left.list, { key: 9 }],
		}

		expect(requiresReplacement(left, extended, ['list.*.key'])).toBe(true)
		expect(requiresReplacement(left, structuredClone(left), ['list.*.key'])).toBe(false)
	})
})

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
})

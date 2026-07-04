import { retry } from '../src/lazy-plugin'

describe('retry', () => {
	it('should attempt exactly the given number of tries', async () => {
		let calls = 0

		await expect(
			retry(3, async () => {
				calls++
				throw new Error('nope')
			})
		).rejects.toThrow('nope')

		expect(calls).toBe(3)
	})

	it('should resolve as soon as an attempt succeeds', async () => {
		let calls = 0

		const result = await retry(3, async () => {
			if (++calls < 3) {
				throw new Error('nope')
			}

			return 'ok'
		})

		expect(result).toBe('ok')
		expect(calls).toBe(3)
	})

	it('should reject with the callback error for a single try', async () => {
		await expect(
			retry(1, async () => {
				throw new Error('single failure')
			})
		).rejects.toThrow('single failure')
	})

	it('should reject with a real error when no attempts are made', async () => {
		await expect(retry(0, async () => 'never')).rejects.toThrow('No retry attempts were made.')
	})
})

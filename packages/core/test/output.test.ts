import { deferredOutput, resolveInputs } from '../src'

describe('output', () => {
	const myError = new Error('original')

	it('deferredOutput should throw the original error', async () => {
		try {
			await deferredOutput(() => {
				throw myError
			})
		} catch (error) {
			expect(error).toBe(myError)
		}
	})

	it('async deferredOutput should throw the original error', async () => {
		try {
			await deferredOutput(async () => {
				throw myError
			})
		} catch (error) {
			expect(error).toBe(myError)
		}
	})

	it('resolveInput should throw the original error', async () => {
		expect(
			resolveInputs(
				deferredOutput(() => {
					throw myError
				})
			)
		).rejects.toThrow(myError)
	})
})

import { deferredOutput, resolveInputs } from '../src'

describe('output', () => {
	const myError = new Error('original')

	it('deferredOutput should throw the original error', async () => {
		await expect(
			Promise.resolve(
				deferredOutput(() => {
					throw myError
				})
			)
		).rejects.toThrow(myError)
	})

	it('async deferredOutput should throw the original error', async () => {
		await expect(
			Promise.resolve(
				deferredOutput(async () => {
					throw myError
				})
			)
		).rejects.toThrow(myError)
	})

	it('sync throwing callback should reject every awaiter, not only the first', async () => {
		const output = deferredOutput(() => {
			throw myError
		})

		await expect(Promise.resolve(output)).rejects.toThrow(myError)
		await expect(Promise.resolve(output)).rejects.toThrow(myError)
	})

	it('resolveInput should throw the original error', async () => {
		await expect(
			resolveInputs(
				deferredOutput(() => {
					throw myError
				})
			)
		).rejects.toThrow(myError)
	})
})

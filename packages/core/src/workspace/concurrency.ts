import promiseLimit from 'p-limit'

export type ConcurrencyQueue = <T>(cb: () => Promise<T>) => Promise<T>

export const createConcurrencyQueue = (concurrency: number): ConcurrencyQueue => {
	const queue = promiseLimit(concurrency)
	return <T>(cb: () => Promise<T>) => {
		return queue(cb)
	}
}

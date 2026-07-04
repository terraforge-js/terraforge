import { App, Stack } from '../src'
import { createMeta } from '../src/meta'

describe('meta', () => {
	const app = new App('meta-test')
	const stack = new Stack(app, 'meta-test-stack')

	it('output should reject with the unresolved error before resolve is called', async () => {
		const meta = createMeta('resource', 'custom:test', stack, 'thing', 'unresolved', {})

		await expect(Promise.resolve(meta.output(data => data))).rejects.toThrow(
			`Unresolved output for resource: ${meta.urn}`
		)
	})

	it('output should resolve after resolve is called with a falsy state', async () => {
		const meta = createMeta('resource', 'custom:test', stack, 'thing', 'falsy', {})

		meta.resolve(undefined as never)

		expect(await meta.output(data => data)).toBeUndefined()
	})

	it('output should recover after resolve, even when awaited too early', async () => {
		const meta = createMeta('resource', 'custom:test', stack, 'thing', 'held', {})

		// Simulates an output captured in another resource's input and
		// awaited before the resource has deployed.
		const held = meta.output(data => data.id)

		await expect(Promise.resolve(held)).rejects.toThrow(`Unresolved output for resource: ${meta.urn}`)

		meta.resolve({ id: 'physical-id' })

		// The same instance must resolve now — resource outputs are volatile
		// and always read the meta's current state.
		expect(await held).toBe('physical-id')
	})

	it('output should not cache a temporary resolve', async () => {
		const meta = createMeta('resource', 'custom:test', stack, 'thing', 'temporary', {})
		const held = meta.output(data => data.id)

		meta.resolve({ id: 'proposed' })
		expect(await held).toBe('proposed')

		meta.resolve({ id: 'actual' })
		expect(await held).toBe('actual')
	})

	it('output should resolve the state property', async () => {
		const meta = createMeta('resource', 'custom:test', stack, 'thing', 'resolved', {})

		meta.resolve({ id: 'physical-id' })

		expect(await meta.output(data => data.id)).toBe('physical-id')
	})
})

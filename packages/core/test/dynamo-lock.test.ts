import { marshall } from '@aws-sdk/util-dynamodb'
import { URN } from '../src'
import { DynamoLockBackend } from '../src/backend/aws/dynamo-lock'

describe('dynamo lock backend', () => {
	const urn = 'urn:app:{test}' as URN

	const conditionalCheckFailed = () => {
		const error = new Error('The conditional request failed')
		error.name = 'ConditionalCheckFailedException'
		return error
	}

	// DynamoDB rejects expression values that no expression references.
	const assertExpressionValuesUsed = (input: any) => {
		const expressions = [input.UpdateExpression, input.ConditionExpression].filter(Boolean).join(' ')

		for (const key of Object.keys(input.ExpressionAttributeValues ?? {})) {
			if (!expressions.includes(key)) {
				const error = new Error(
					`Value provided in ExpressionAttributeValues unused in expressions: keys: {${key}}`
				)
				error.name = 'ValidationException'
				throw error
			}
		}
	}

	const createBackend = (
		stub: { updateItem?: (input: any) => Promise<any>; item?: any },
		renewInterval?: number
	) => {
		const updates: any[] = []

		const backend = new DynamoLockBackend({
			credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
			region: 'us-east-1',
			tableName: 'locks',
			renewInterval,
		})

		;(backend as any).client = {
			async updateItem(input: any) {
				updates.push(input)
				assertExpressionValuesUsed(input)
				return stub.updateItem ? stub.updateItem(input) : {}
			},
			async getItem() {
				return { Item: stub.item }
			},
		}

		return { backend, updates }
	}

	const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

	it('should acquire with an expiry and allow taking over an expired lock', async () => {
		const { backend, updates } = createBackend({})

		const release = await backend.lock(urn)

		expect(updates).toHaveLength(1)
		expect(updates[0].ConditionExpression).toBe('attribute_not_exists(#lock) OR #expires < :now')
		expect(updates[0].UpdateExpression).toBe('SET #lock = :id, #expires = :expires')

		await release()

		expect(updates).toHaveLength(2)
		expect(updates[1].ConditionExpression).toBe('#lock = :id')
		expect(updates[1].UpdateExpression).toBe('REMOVE #lock, #expires')
	})

	it('should renew the lock while held', async () => {
		const { backend, updates } = createBackend({}, 10)

		const release = await backend.lock(urn)
		await sleep(35)
		await release()

		const renewals = updates.slice(1, -1)
		expect(renewals.length).toBeGreaterThanOrEqual(2)

		for (const renewal of renewals) {
			expect(renewal.ConditionExpression).toBe('#lock = :id')
			expect(renewal.UpdateExpression).toBe('SET #lock = :id, #expires = :expires')
			expect(Object.keys(renewal.ExpressionAttributeValues).sort()).toEqual([':expires', ':id'])
		}
	})

	it('renewal should keep retrying after a transient error', async () => {
		let calls = 0
		const { backend, updates } = createBackend(
			{
				updateItem: async () => {
					// The acquire succeeds, every renewal fails with a network error.
					if (++calls > 1) {
						throw new Error('network down')
					}
					return {}
				},
			},
			10
		)

		const release = await backend.lock(urn)
		await sleep(35)
		await release().catch(() => {})

		expect(updates.length).toBeGreaterThanOrEqual(3)
	})

	it('renewal should stop when the lock was stolen', async () => {
		let calls = 0
		const { backend, updates } = createBackend(
			{
				updateItem: async () => {
					if (++calls === 2) {
						throw conditionalCheckFailed()
					}
					return {}
				},
			},
			10
		)

		await backend.lock(urn)
		await sleep(50)

		expect(updates).toHaveLength(2)
	})

	it('release should no-op when the lock was stolen', async () => {
		let calls = 0
		const { backend } = createBackend({
			updateItem: async () => {
				// Acquire succeeds, release hits the failed condition.
				if (++calls > 1) {
					throw conditionalCheckFailed()
				}
				return {}
			},
		})

		const release = await backend.lock(urn)

		await expect(release()).resolves.toBeUndefined()
	})

	it('release should rethrow real errors', async () => {
		let calls = 0
		const { backend } = createBackend({
			updateItem: async () => {
				if (++calls > 1) {
					throw new Error('network down')
				}
				return {}
			},
		})

		const release = await backend.lock(urn)

		await expect(release()).rejects.toThrow('network down')
	})

	it('locked should be false for missing and expired locks', async () => {
		const missing = createBackend({ item: undefined })
		expect(await missing.backend.locked(urn)).toBe(false)

		const expired = createBackend({
			item: marshall({ urn, lock: 'some-id', expires: Date.now() - 1000 }),
		})
		expect(await expired.backend.locked(urn)).toBe(false)
	})

	it('locked should be true for live locks', async () => {
		const live = createBackend({
			item: marshall({ urn, lock: 'some-id', expires: Date.now() + 60_000 }),
		})
		expect(await live.backend.locked(urn)).toBe(true)
	})
})

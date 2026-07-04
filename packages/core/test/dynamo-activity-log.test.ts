import { URN } from '../src'
import { DynamoActivityLogBackend } from '../src/backend/aws/dynamo-activity-log'

describe('dynamo activity log backend', () => {
	const urn = 'urn:app:{test}' as URN

	const createBackend = (user?: string) => {
		const items: any[] = []

		const backend = new DynamoActivityLogBackend({
			credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
			region: 'us-east-1',
			tableName: 'activity',
			user,
		})

		// Stub the network client — the marshalling is what's under test.
		;(backend as any).client = {
			async putItem(input: any) {
				items.push(input.Item)
				return {}
			},
		}

		return { backend, items }
	}

	it('should log without a user and without filters', async () => {
		const { backend, items } = createBackend()

		await backend.log(urn, { action: 'deploy', filters: undefined })

		expect(items).toHaveLength(1)
		expect(items[0].urn).toEqual({ S: urn })
		expect(items[0].action).toEqual({ S: 'deploy' })
		expect(items[0].user).toBeUndefined()
		expect(items[0].filters).toBeUndefined()
	})

	it('should log the user and filters when present', async () => {
		const { backend, items } = createBackend('ivan')

		await backend.log(urn, { action: 'delete', filters: ['stack-1'] })

		expect(items[0].user).toEqual({ S: 'ivan' })
		expect(items[0].filters).toEqual({ L: [{ S: 'stack-1' }] })
	})
})

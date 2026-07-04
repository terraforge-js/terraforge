import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'node:crypto'
import { URN } from '../../urn.ts'
import { AlreadyLockedError, LockBackend } from '../lock.ts'

type Props = {
	credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider
	region: string
	tableName: string
}

// A lock expires if not renewed; the heartbeat renews it while held. A
// crashed holder therefore blocks other processes for at most LOCK_TTL.
const LOCK_TTL = 5 * 60_000
const RENEW_INTERVAL = 60_000

const isConditionalCheckFailed = (error: unknown) => {
	return error instanceof Error && error.name === 'ConditionalCheckFailedException'
}

export class DynamoLockBackend implements LockBackend {
	protected client: DynamoDB

	constructor(private props: Props) {
		this.client = new DynamoDB(props)
	}

	async insecureReleaseLock(urn: URN) {
		await this.client.updateItem({
			TableName: this.props.tableName,
			Key: marshall({ urn }),
			ExpressionAttributeNames: { '#lock': 'lock', '#expires': 'expires' },
			UpdateExpression: 'REMOVE #lock, #expires',
		})
	}

	async locked(urn: URN) {
		const result = await this.client.getItem({
			TableName: this.props.tableName,
			Key: marshall({ urn }),
		})

		if (!result.Item) {
			return false
		}

		const item = unmarshall(result.Item)

		if (item.lock === undefined || item.lock === null) {
			return false
		}

		// A lock without an expiry (acquired by an older version) never
		// expires and still blocks acquisition.
		if (typeof item.expires === 'number') {
			return item.expires > Date.now()
		}

		return true
	}

	async lock(urn: URN) {
		const id = randomUUID()

		const set = (condition: string) => {
			return this.client.updateItem({
				TableName: this.props.tableName,
				Key: marshall({ urn }),
				ExpressionAttributeNames: { '#lock': 'lock', '#expires': 'expires' },
				ExpressionAttributeValues: marshall({
					':id': id,
					':expires': Date.now() + LOCK_TTL,
					':now': Date.now(),
				}),
				UpdateExpression: 'SET #lock = :id, #expires = :expires',
				ConditionExpression: condition,
			})
		}

		// Acquire: free, or held by a holder that stopped renewing.
		try {
			await set('attribute_not_exists(#lock) OR #expires < :now')
		} catch (error) {
			if (isConditionalCheckFailed(error)) {
				throw new AlreadyLockedError(urn)
			}

			throw error
		}

		// Renew while held; stop renewing if the lock was stolen.
		const interval = setInterval(() => {
			set('#lock = :id').catch(() => clearInterval(interval))
		}, RENEW_INTERVAL)
		interval.unref?.()

		return async () => {
			clearInterval(interval)

			try {
				await this.client.updateItem({
					TableName: this.props.tableName,
					Key: marshall({ urn }),
					ExpressionAttributeNames: { '#lock': 'lock', '#expires': 'expires' },
					ExpressionAttributeValues: { ':id': marshall(id) },
					UpdateExpression: 'REMOVE #lock, #expires',
					ConditionExpression: '#lock = :id',
				})
			} catch (error) {
				// The lock isn't ours anymore — there's nothing to release.
				if (!isConditionalCheckFailed(error)) {
					throw error
				}
			}
		}
	}
}

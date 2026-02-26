import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { URN } from '../../urn.ts'
import { ActivityLogBackend, Log, LogProps } from '../activity-log.ts'

type Props = {
	credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider
	region: string
	tableName: string
	user?: string
}

export class DynamoActivityLogBackend implements ActivityLogBackend {
	protected client: DynamoDB

	constructor(private props: Props) {
		this.client = new DynamoDB(props)
	}

	async log(urn: URN, log: LogProps) {
		await this.client.putItem({
			TableName: this.props.tableName,
			Item: marshall({
				urn,
				user: this.props.user,
				date: Date.now(),
				...log,
			}),
		})
	}

	async tail(urn: URN, limit = 10) {
		const result = await this.client.query({
			TableName: this.props.tableName,
			KeyConditionExpression: '#urn = :urn',
			ExpressionAttributeNames: { '#urn': 'urn' },
			ExpressionAttributeValues: { ':urn': marshall(urn) },
			ScanIndexForward: false,
			Limit: limit,
		})

		return (
			result.Items?.map(item => {
				return unmarshall(item) as Log
			}) ?? []
		)
	}
}

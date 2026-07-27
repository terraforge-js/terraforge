import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { URN } from '../../urn.ts'
import { AppState } from '../../workspace/state.ts'
import { StateBackend } from '../state.ts'

type Props = {
	credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider
	region: string
	bucket: string
}

export class S3StateBackend implements StateBackend {
	protected client: S3Client

	constructor(private props: Props) {
		this.client = new S3Client(props)
	}

	async get(urn: URN) {
		let result
		try {
			result = await this.client.send(
				new GetObjectCommand({
					Bucket: this.props.bucket,
					Key: `${urn}.state`,
				})
			)
		} catch (error) {
			// Matched by name only, because a runtime holding two module
			// copies of the s3 client constructs errors that fail an
			// instanceof check against the local exception class.
			if (error instanceof Error && error.name === 'NoSuchKey') {
				return
			}

			throw error
		}

		if (!result.Body) {
			return
		}

		const body = await result.Body.transformToString('utf8')
		const state = JSON.parse(body)

		return state
	}

	async update(urn: URN, state: AppState) {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.props.bucket,
				Key: `${urn}.state`,
				Body: JSON.stringify(state),
			})
		)
	}

	async delete(urn: URN) {
		await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.props.bucket,
				Key: `${urn}.state`,
			})
		)
	}
}

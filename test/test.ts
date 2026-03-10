import { aws } from '@terraforge/aws'
// import { cloudflare } from '@terraforge/cloudflare'
import {
	App,
	FileActivityLogBackend,
	FileLockBackend,
	FileStateBackend,
	Group,
	Stack,
	WorkSpace,
} from '@terraforge/core'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'

const dir = './test'
// const activityLog = new FileActivityLogBackend({ dir, user: 'unknown' })

const workspace = new WorkSpace({
	backend: {
		// activityLog,
		state: new FileStateBackend({ dir }),
		lock: new FileLockBackend({ dir }),
	},
	providers: [
		aws({
			region: 'us-east-1',
			profile: 'jacksclub',
			// accessKey: ''
		}),
	],
})

const app = new App('app')
const stack = new Stack(app, 'stack')

const table = new aws.dynamodb.Table(stack, 'table', {
	name: 'my-table',
	billingMode: 'PAY_PER_REQUEST',
	hashKey: 'pk',
	rangeKey: 'sk',
	attribute: [
		{ name: 'pk', type: 'S' },
		{ name: 'sk', type: 'S' },
	],
	streamEnabled: true,
	streamViewType: 'NEW_AND_OLD_IMAGES',
})

const role = new aws.iam.Role(stack, 'lambda-role', {
	name: 'my-lambda-role-2',
	assumeRolePolicy: JSON.stringify({
		Version: '2012-10-17',
		Statement: [
			{
				Effect: 'Allow',
				Principal: { Service: 'lambda.amazonaws.com' },
				Action: 'sts:AssumeRole',
			},
		],
	}),
	managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
})

new aws.iam.RolePolicy(stack, 'lambda-dynamo-policy', {
	name: 'dynamodb-stream-access',
	role: role.name,
	policy: JSON.stringify({
		Version: '2012-10-17',
		Statement: [
			{
				Effect: 'Allow',
				Action: [
					'dynamodb:GetRecords',
					'dynamodb:GetShardIterator',
					'dynamodb:DescribeStream',
					'dynamodb:ListStreams',
				],
				Resource: '*',
			},
		],
	}),
})

const fn = new aws.lambda.Function(stack, 'function', {
	functionName: 'test-1',
	role: role.arn,
	runtime: 'nodejs24.x',
	handler: 'index.default',
	filename: join(__dirname, '/lambda.zip'),
})

new aws.lambda.EventSourceMapping(stack, 'event-source-mapping', {
	functionName: fn.functionName,
	maximumBatchingWindowInSeconds: Math.floor(Math.random() * 10 + 5),
	eventSourceArn: table.streamArn,
	startingPosition: 'LATEST',
	batchSize: 10,
})

await workspace.deploy(app)

console.log('DONE!')

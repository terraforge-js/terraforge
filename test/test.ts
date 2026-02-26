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

const dir = './test'
const activityLog = new FileActivityLogBackend({ dir, user: 'unknown' })

const workspace = new WorkSpace({
	backend: {
		activityLog,
		state: new FileStateBackend({ dir }),
		lock: new FileLockBackend({ dir }),
	},
	providers: [
		aws({
			region: 'us-east-1',
			profile: 'default',
			// accessKey: ''
		}),
	],
})

const app = new App('app')
// const stack = new Stack(app, 'stack')
// const group = new Group(stack, 'stack', 'lol')

// const bucket = new aws.s3.Bucket(
// 	group,
// 	'bucket',
// 	{
// 		bucket: 'name-1',
// 	},
// 	{
// 		replaceOnChanges: ['bucket'],
// 		createBeforeReplace: true,
// 	}
// )

// const item = new aws.s3.BucketObject(group, 'object', {
// 	bucket: bucket.bucket,
// 	key: 'item',
// })

await workspace.deploy(app)

console.log('Logs:', await activityLog.tail(app.urn))

// await provider.createResource({
// 	'type': 'aws_s3_bucket',
// 	'state': {}
// })

// const vpc = new aws.Vpc(group, 'vpc', {})
// const bucket1 = new aws.s3.Bucket(group, 'bucket-1', { bucket: 'my-special-name-123' })
// const bucket2 = aws.s3.getBucket(group, 'bucket-2', { bucket: 'my-special-name-123' })
// const param = aws.ssm.getParameter(
// 	stack,
// 	'param',
// 	{ name: 'my-param-name' },
// 	{
// 		dependsOn: [vpc, bucket1, bucket2],
// 	}
// )

// bucket1.urn
// vpc.urn
// param.urn

// param.withDecryption.pipe(value => {
// 	console.log('Parameter value:', value)
// })

// param.id.pipe(id => {
// 	console.log('Parameter ID:', id)
// })

// class MyClass {
// 	readonly id = '1'
// 	// declare [key: string]: unknown
// }

// function test(params: Record<string, any>) {
// 	console.log('Test function called')
// }

// test(new MyClass())

// // const lol = new Resource()

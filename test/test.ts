import { aws } from '@terraforge/aws'
import { App, Stack } from '@terraforge/core'
import { split } from './split'

const app = new App('app')
const stack = new Stack(app, 'stack')

await aws.install()

if (await aws.isInstalled()) {
	console.log('AWS is installed')
} else {
	console.log('AWS is not installed')
}

split.Bucket

// await aws.install()

const vpc = new aws.Vpc(stack, 'vpc', {})

const bucket1 = new aws.s3.Bucket(stack, 'bucket-1', {
	bucket: 'my-special-name-123',
})

const bucket2 = aws.s3.getBucket(stack, 'bucket-2', {
	bucket: 'my-special-name-123',
})

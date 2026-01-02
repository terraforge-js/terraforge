import { aws } from '@terraforge/aws'
import { App, Resource, Stack } from '@terraforge/core'

const app = new App('app')
const stack = new Stack(app, 'stack')

await aws.install()

if (await aws.isInstalled()) {
	console.log('AWS is installed')
} else {
	console.log('AWS is not installed')
}

// await aws.install()

const vpc = new aws.Vpc(stack, 'vpc', {})
const bucket1 = new aws.s3.Bucket(stack, 'bucket-1', { bucket: 'my-special-name-123' })
const bucket2 = aws.s3.getBucket(stack, 'bucket-2', { bucket: 'my-special-name-123' })
const param = aws.ssm.getParameter(
	stack,
	'param',
	{ name: 'my-param-name' },
	{
		dependsOn: [vpc, bucket1, bucket2],
	}
)

bucket1.urn
vpc.urn
param.urn

param.withDecryption.pipe(value => {
	console.log('Parameter value:', value)
})

param.id.pipe(id => {
	console.log('Parameter ID:', id)
})

class MyClass {
	readonly id = '1'
	// declare [key: string]: unknown
}

function test(params: Record<string, any>) {
	console.log('Test function called')
}

test(new MyClass())

// const lol = new Resource()

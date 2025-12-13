```ts

import { WorkSpace, FileStateBackend, FileLockBackend } from '@terraforge/core';
import { aws } from '@terraforge/aws';

const workspace = new WorkSpace({
	backend: {
		state: new FileStateBackend({ dir }),
		lock: new FileLockBackend({ dir }),
	},
	providers: [
		aws({
			profile: 'jacksclub',
			region: 'us-east-1',
		}),
	],
})

const app = new App('todo-app')
const storage = new Stack(app, 'storage')
const list = new aws.s3.Bucket(storage, 'list', {})

const items = new Stack(app, 'items')
const todo = new aws.s3.BucketObject(items, 'item', {
	bucket: list.bucket,
	key: 'item-1',
	content: JSON.stringify({
		title: 'Write docs...',
		done: true,
	}),
})

await workspace.deploy(app)

```

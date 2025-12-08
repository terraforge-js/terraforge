#!/usr/bin/env bun

import { parseArgs } from 'util'
import { createLazyPlugin } from '../src/lazy-plugin'
import { Version } from '../src/plugin/registry'
import { generateTypes } from '../src/type-gen'

const { values } = parseArgs({
	args: Bun.argv,
	options: {
		org: {
			type: 'string',
		},
		type: {
			type: 'string',
		},
	},
	strict: true,
	allowPositionals: true,
})

if (!values.org) {
	console.error('Missing required arguments: org')
	process.exit(1)
}

if (!values.type) {
	console.error('Missing required arguments: type')
	process.exit(1)
}

const packageData = (await Bun.file('./package.json').json()) as { version?: Version }

if (!packageData) {
	console.error('Failed to read package.json')
	process.exit(1)
}

if (!packageData.version) {
	console.error('Missing required arguments: version')
	process.exit(1)
}

const org = values.org
const type = values.type
const version = packageData.version

console.log('org:     ', org)
console.log('type:    ', type)
console.log('version: ', version)

const ok = confirm('Continue?')

if (!ok) {
	process.exit(0)
}

const load = createLazyPlugin({ org, type, version })
const plugin = await load()
const schema = plugin.schema()
const types = generateTypes(
	{
		[type]: schema.provider,
	},
	schema.resources,
	schema.dataSources
)

await plugin.stop()

await Bun.write(`./src/types.ts`, types)

await Bun.write(
	`./src/index.ts`,
	`
import { createTerraformAPI } from '@terraforge/terraform'
import { root } from './types.ts'

export const ${type} = createTerraformAPI<typeof root.${type}>({
	namespace: '${type}',
	provider: { org: '${org}', type: '${type}', version: '${version}' },
}) as typeof root.${type}
`
)

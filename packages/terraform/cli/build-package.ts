#!/usr/bin/env bun

import { createLazyPlugin } from '../src/lazy-plugin'
import { Version } from '../src/plugin/registry'
import { generateTypes } from '../src/type-gen'

const packageData = (await Bun.file('./package.json').json()) as {
	version?: string
	provider?: {
		version?: Version
		org?: string
		type?: string
	}
}

if (!packageData) {
	console.error('Failed to read package.json')
	process.exit(1)
}

const providerData = packageData.provider

if (!providerData) {
	console.error('Missing required property: provider')
	process.exit(1)
}

if (!providerData.version) {
	console.error('Missing required property: provider.version')
	process.exit(1)
}

if (!providerData.org) {
	console.error('Missing required property: provider.org')
	process.exit(1)
}

if (!providerData.type) {
	console.error('Missing required property: provider.type')
	process.exit(1)
}

const org = providerData.org
const type = providerData.type
const version = providerData.version

console.log('')
console.log('Package version:  ', packageData.version)
console.log('')
console.log('Provider org:     ', org)
console.log('Provider type:    ', type)
console.log('Provider version: ', version)
console.log('')

const ok = confirm('Continue?')

if (!ok) {
	console.log('')
	process.exit(1)
}

const load = createLazyPlugin({ org, type, version })

console.log('')
console.log('Loading provider plugin...')

const plugin = await load()

console.log('Provider plugin loaded.')

const schema = plugin.schema()

await plugin.stop()

// const installTypes = generateInstallHelperFunctions(type)
// await Bun.write(`./dist/install.d.ts`, installTypes)

// const providerTypes = generateProviderFactoryTypes(type, schema.provider)
// await Bun.write(`./dist/provider.d.ts`, providerTypes)

// const resourceTypes = generateResourceTypes(schema.resources)
// await Bun.write(`./dist/resources.d.ts`, resourceTypes)

// const dataSourceTypes = generateResourceTypes(schema.dataSources)
// await Bun.write(`./dist/data-sources.d.ts`, dataSourceTypes)

// await Bun.write(
// 	`./dist/index.d.ts`,
// 	`
// /// <reference path="./install.d.ts" />
// /// <reference path="./provider.d.ts" />
// /// <reference path="./resources.d.ts" />
// /// <reference path="./data-sources.d.ts" />

// export { aws }
// `
// )

await Bun.write(`./dist/index.d.ts`, generateTypes(type, schema.provider, schema.resources, schema.dataSources))

await Bun.write(
	`./dist/index.js`,
	`
import { createTerraformProxy } from '@terraforge/terraform'

export const ${type} = createTerraformProxy({
	namespace: '${type}',
	provider: { org: '${org}', type: '${type}', version: '${version}' },
})
`
)

console.log('')
console.log('Package done building.')
process.exit(0)

#!/usr/bin/env bun

// import { build } from 'tsup'
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

if (!packageData || !packageData.provider) {
	console.error('Failed to read package.json')
	process.exit(1)
}

const providerData = packageData.provider

if (!providerData.version) {
	console.error('Missing required arguments: version')
	process.exit(1)
}

if (!providerData.org) {
	console.error('Missing required arguments: org')
	process.exit(1)
}

if (!providerData.type) {
	console.error('Missing required arguments: type')
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
const schema = plugin.schema()
const types = generateTypes(
	{
		[type]: schema.provider,
	},
	schema.resources,
	schema.dataSources
)

await plugin.stop()

await Bun.write(`./dist/index.d.ts`, types)
await Bun.write(
	`./dist/index.js`,
	`
import { createTerraformAPI } from '@terraforge/terraform'

export const ${type} = createTerraformAPI({
	namespace: '${type}',
	provider: { org: '${org}', type: '${type}', version: '${version}' },
})
`
)

// await Bun.write(`./src/index.ts`, `export { ${type} } from './types.ts'`)

// await build({
// 	entry: ['src/index.ts'],
// 	format: 'esm',
// 	dts: true,
// 	clean: true,
// 	outDir: './dist',
// 	// tsup src/index.ts --format esm --dts --clean --out-dir ./dist
// })

console.log('Done.')
process.exit(0)

// await Bun.write(
// 	`./src/index.ts`,
// 	`
// import { createTerraformAPI } from '@terraforge/terraform'
// import { root } from './types.ts'

// // @ts-ignore
// export const ${type} = createTerraformAPI<typeof root.${type}>({
// 	namespace: '${type}',
// 	provider: { org: '${org}', type: '${type}', version: '${version}' },
// }) as typeof root.${type}

// declare module '.' {
// 	import ${type} = root.${type}
// 	// @ts-ignore
// 	export { ${type} }
// }
// `
// )

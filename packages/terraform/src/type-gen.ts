import { camelCase, pascalCase } from 'change-case'
import type { Property } from './plugin/schema.ts'

const tab = (indent: number) => {
	return '\t'.repeat(indent)
}

export const generateTypes = (
	namespace: string,
	provider: Property,
	resources: Record<string, Property>,
	dataSources: Record<string, Property>
): string => {
	return [
		generateImport('c', '@terraforge/core'),
		generateImport('t', '@terraforge/terraform'),
		'type _Record<T> = Record<string, T>',
		generateInstallHelperFunctions(namespace),
		generateProviderFactoryTypes(namespace, provider),
		generateResourceTypes(resources),
		generateDataSourceTypes(dataSources),
	].join('\n\n')
}

export const generateResourceTypes = (resources: Record<string, Property>): string[] => {
	return generateNamespace(resources, (name, prop, indent) => {
		const typeName = pascalCase(name)

		return [
			`${tab(indent)}export type ${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
			`${tab(indent)}export type ${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
			`${tab(indent)}export class ${typeName} {`,
			`${tab(indent + 1)}constructor(parent: c.Group, id: string, props: ${typeName}Input, config?:c.ResourceConfig)`,
			generateClassProperties(prop, indent + 1),
			`${tab(indent)}}`,
		].join('\n\n')
	})
}

export const generateDataSourceTypes = (dataSources: Record<string, Property>): string[] => {
	return generateNamespace(dataSources, (name, prop, indent) => {
		const typeName = pascalCase(name)

		return [
			`${tab(indent)}export type Get${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
			`${tab(indent)}export type Get${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
			`${tab(indent)}export const get${typeName}:c.DataSourceFunction<Get${typeName}Input, Get${typeName}Output>`,
		].join('\n\n')
	})
}

export const generateProviderFactoryTypes = (namespace: string, provider: Property): string => {
	const typeName = namespace.toLowerCase()
	return `export declare function ${typeName}(props: ${generatePropertyInputConst(provider, 0)}, config?: t.TerraformProviderConfig): t.TerraformProvider`
}

const generateImport = (name: string, from: string) => {
	return `import * as ${name} from '${from}'`
}

export const generateInstallHelperFunctions = (namespace: string) => {
	const typeName = namespace.toLowerCase()

	return [
		`export declare namespace ${typeName} {`,
		`${tab(1)}export function install(props?: t.InstallProps): Promise<void>`,
		`${tab(1)}export function uninstall(props?: t.InstallProps): Promise<void>`,
		`${tab(1)}export function isInstalled(props?: t.InstallProps): Promise<boolean>`,
		`}`,
	].join('\n')
}

const generatePropertyInputConst = (prop: Property, indent: number) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, _, ctx) => {
			return `${v}${ctx.depth === 1 ? ',' : ''}`
		},
		filter: () => true,
		optional: p => p.optional ?? false,
	})
}

const generatePropertyInputType = (prop: Property, indent: number) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, p, ctx) => {
			return ctx.depth > 0 ? (p.optional ? `c.OptionalInput<${v}>` : `c.Input<${v}>`) : v
		},
		filter: prop =>
			!(prop.computed && typeof prop.optional === 'undefined' && typeof prop.required === 'undefined'),
		optional: p => p.optional ?? false,
	})
}

const generatePropertyOutputType = (prop: Property, indent: number) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, p, ctx) =>
			ctx.depth === 1 ? (p.optional && !p.computed ? `c.OptionalOutput<${v}>` : `c.Output<${v}>`) : v,
		filter: () => true,
		readonly: true,
		// required: true,
		optional: (p, ctx) => (ctx.depth > 1 && p.optional && !p.computed) || false,
	})
}

const generateClassProperties = (prop: Property, indent: number) => {
	// return generateValue(prop, {
	// 	indent: indent + 1,
	// 	depth: 0,
	// 	wrap: (v, p, ctx) => (ctx.depth === 1 ? `Output<${p.optional && !p.computed ? `${v} | undefined` : v}>` : v),
	// 	filter: () => true,
	// 	readonly: true,
	// 	// required: true,
	// 	optional: (p, ctx) => (ctx.depth > 1 && p.optional && !p.computed) || false,
	// }).substring(1)

	if (prop.type !== 'object') {
		return ''
	}

	return Object.entries(prop.properties)
		.map(([name, prop]) => {
			// const
			return [
				prop.description
					? [`\n`, `\t`.repeat(indent), `/** `, prop.description.trim(), ' */', '\n'].join('')
					: '',
				`\t`.repeat(indent),
				'readonly ',
				camelCase(name),
				// ctx.optional(prop, ctx) ? '?' : '',
				': ',
				generateValue(prop, {
					readonly: true,
					filter: () => true,
					optional: (p, ctx) => (ctx.depth > 1 && p.optional && !p.computed) || false,
					wrap: (v, p, ctx) => {
						return ctx.depth === 1
							? p.optional && !p.computed
								? `c.OptionalOutput<${v}>`
								: `c.Output<${v}>`
							: v
					},
					// ctx.depth === 1 ? `c.Output<${p.optional && !p.computed ? `${v} | undefined` : v}>` : v,
					indent: indent + 1,
					depth: 1,
				}),
			].join('')
		})
		.join('\n')
}

type NamespaceGroup = {
	[key: string]: NamespaceGroup | string
}

const groupByNamespace = (resources: Record<string, Property>, minLevel: number, maxLevel: number) => {
	const grouped: NamespaceGroup = {}
	const types = Object.keys(resources).sort()

	for (const type of types) {
		const names = type.split('_')

		if (names.length < minLevel) {
			throw new Error(`Resource not properly namespaced: ${type}`)
		}

		let current = grouped
		let count = Math.min(maxLevel, names.length - 1)

		while (count--) {
			const ns = camelCase(names.shift()!)
			if (!current[ns]) {
				current[ns] = {}
			}
			current = current[ns] as {}
		}

		const name = pascalCase(names.join('_'))
		current[name] = type
	}

	return grouped
}

const generateNamespace = (
	resources: Record<string, Property>,
	render: (name: string, prop: Property, indent: number) => string
) => {
	const grouped = groupByNamespace(resources, 1, 2)

	// console.log(grouped, Object.keys(resources))
	// console.log(resources['aws'])

	const renderNamespace = (name: string, group: NamespaceGroup | string, indent: number): string => {
		if (name === 'default') {
			name = '$default'
		}

		// console.log(name)
		if (typeof group === 'string') {
			return render(name, resources[group]!, indent)
		}

		return [
			`${tab(indent)}export ${indent === 0 ? 'declare ' : ''}namespace ${name.toLowerCase()} {`,
			Object.entries(group)
				.map(([name, entry]) => {
					if (typeof entry !== 'string') {
						return renderNamespace(name, entry, indent + 1)
					} else {
						return render(name, resources[entry]!, indent + 1)
					}
				})
				.join('\n'),
			`${tab(indent)}}`,
		].join('\n')
	}

	// const code: string[] = [`declare module '@awsless/formation' {`]

	// code.push(renderNamespace('$', grouped, 1))

	// code.push(`}`)

	// return code.join('\n')

	// return renderNamespace('root', grouped, 0)
	// console.log(grouped)

	return Object.entries(grouped).map(([name, entry]) => {
		// console.log(name, entry)
		return renderNamespace(name, entry, 0)
	})
}

type Context = {
	indent: number
	depth: number
	wrap: (type: string, prop: Property, ctx: Context) => string
	filter: (prop: Property) => boolean
	readonly?: boolean
	optional: (prop: Property, ctx: Context) => boolean
}

const generateValue = (prop: Property, ctx: Context): string => {
	if (['string', 'number', 'boolean', 'unknown'].includes(prop.type)) {
		return ctx.wrap(prop.type, prop, ctx)
	}

	if (prop.type === 'array') {
		const type = generateValue(prop.item, { ...ctx, depth: ctx.depth + 1 })
		const array = ctx.readonly ? `ReadonlyArray<${type}>` : `Array<${type}>`
		return ctx.wrap(array, prop, ctx)
	}

	if (prop.type === 'record') {
		const type = generateValue(prop.item, { ...ctx, depth: ctx.depth + 1 })
		const record = ctx.readonly ? `Readonly<_Record<${type}>>` : `_Record<${type}>`
		return ctx.wrap(record, prop, ctx)
	}

	if (prop.type === 'object' || prop.type === 'array-object') {
		const type = [
			'{',
			Object.entries(prop.properties)
				.filter(([_, p]) => ctx.filter(p))
				.map(([name, prop]) =>
					[
						prop.description
							? [`\n`, `\t`.repeat(ctx.indent), `/** `, prop.description.trim(), ' */', '\n'].join('')
							: '',
						`\t`.repeat(ctx.indent),
						// ctx.readonly ? "readonly " : "",
						camelCase(name),
						ctx.optional(prop, ctx) ? '?' : '',
						': ',
						generateValue(prop, { ...ctx, indent: ctx.indent + 1, depth: ctx.depth + 1 }),
					].join('')
				)
				.join('\n'),
			`${`\t`.repeat(ctx.indent - 1)}}`,
		].join('\n')

		const object = ctx.readonly ? `Readonly<${type}>` : type

		return ctx.wrap(object, prop, ctx)
	}

	throw new Error(`Unknown property type: ${prop.type}`)
}

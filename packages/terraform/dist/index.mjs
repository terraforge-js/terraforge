import { camelCase, pascalCase, snakeCase } from "change-case";
import { ResourceNotFound, createDebugger, createMeta, nodeMetaSymbol } from "@terraforge/core";
import { pack, unpack } from "msgpackr";
import { credentials, loadPackageDefinition } from "@grpc/grpc-js";
import { fromJSON } from "@grpc/proto-loader";
import jszip from "jszip";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { arch, homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { compare } from "semver";
import { spawn } from "node:child_process";

//#region src/type-gen.ts
const tab = (indent) => {
	return "	".repeat(indent);
};
const generateTypes = (namespace, provider, resources, dataSources) => {
	return [
		generateImport("c", "@terraforge/core"),
		generateImport("t", "@terraforge/terraform"),
		"type _Record<T> = Record<string, T>",
		generateInstallHelperFunctions(namespace),
		generateProviderFactoryTypes(namespace, provider),
		generateResourceTypes(resources),
		generateDataSourceTypes(dataSources)
	].join("\n\n");
};
const generateResourceTypes = (resources) => {
	return generateNamespace(resources, (name, prop, indent) => {
		const typeName = pascalCase(name);
		return [
			`${tab(indent)}export type ${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
			`${tab(indent)}export type ${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
			`${tab(indent)}export class ${typeName} {`,
			`${tab(indent + 1)}constructor(parent: c.Group, id: string, props: ${typeName}Input, config?:c.ResourceConfig)`,
			`${tab(indent + 2)}readonly [c.nodeMetaSymbol]: c.ResourceMeta`,
			`${tab(indent + 2)}readonly urn: c.URN`,
			generateClassProperties(prop, indent + 1),
			`${tab(indent)}}`
		].join("\n\n");
	});
};
const generateDataSourceTypes = (dataSources) => {
	return generateNamespace(dataSources, (name, prop, indent) => {
		const typeName = pascalCase(name);
		return [
			`${tab(indent)}export type Get${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
			`${tab(indent)}export type Get${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
			`${tab(indent)}export const get${typeName}:c.DataSourceFunction<Get${typeName}Input, Get${typeName}Output>`
		].join("\n\n");
	});
};
const generateProviderFactoryTypes = (namespace, provider) => {
	return `export declare function ${namespace.toLowerCase()}(props: ${generatePropertyInputConst(provider, 0)}, config?: t.TerraformProviderConfig): t.TerraformProvider`;
};
const generateImport = (name, from) => {
	return `import * as ${name} from '${from}'`;
};
const generateInstallHelperFunctions = (namespace) => {
	return [
		`export declare namespace ${namespace.toLowerCase()} {`,
		`${tab(1)}export function install(props?: t.InstallProps): Promise<void>`,
		`${tab(1)}export function uninstall(props?: t.InstallProps): Promise<void>`,
		`${tab(1)}export function isInstalled(props?: t.InstallProps): Promise<boolean>`,
		`}`
	].join("\n");
};
const generatePropertyInputConst = (prop, indent) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, _, ctx) => {
			return `${v}${ctx.depth === 1 ? "," : ""}`;
		},
		filter: () => true,
		optional: (p) => p.optional ?? false
	});
};
const generatePropertyInputType = (prop, indent) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, p, ctx) => {
			return ctx.depth > 0 ? p.optional ? `c.OptionalInput<${v}>` : `c.Input<${v}>` : v;
		},
		filter: (prop$1) => !(prop$1.computed && typeof prop$1.optional === "undefined" && typeof prop$1.required === "undefined"),
		optional: (p) => p.optional ?? false
	});
};
const generatePropertyOutputType = (prop, indent) => {
	return generateValue(prop, {
		depth: 0,
		indent: indent + 1,
		wrap: (v, p, ctx) => ctx.depth === 1 ? p.optional && !p.computed ? `c.OptionalOutput<${v}>` : `c.Output<${v}>` : v,
		filter: () => true,
		readonly: true,
		optional: (p, ctx) => ctx.depth > 1 && p.optional && !p.computed || false
	});
};
const generateClassProperties = (prop, indent) => {
	if (prop.type !== "object") return "";
	return Object.entries(prop.properties).map(([name, prop$1]) => {
		return [
			prop$1.description ? [
				`\n`,
				`\t`.repeat(indent),
				`/** `,
				prop$1.description.trim(),
				" */",
				"\n"
			].join("") : "",
			`\t`.repeat(indent),
			"readonly ",
			camelCase(name),
			": ",
			generateValue(prop$1, {
				readonly: true,
				filter: () => true,
				optional: (p, ctx) => ctx.depth > 1 && p.optional && !p.computed || false,
				wrap: (v, p, ctx) => {
					return ctx.depth === 1 ? p.optional && !p.computed ? `c.OptionalOutput<${v}>` : `c.Output<${v}>` : v;
				},
				indent: indent + 1,
				depth: 1
			})
		].join("");
	}).join("\n");
};
const groupByNamespace = (resources, minLevel, maxLevel) => {
	const grouped = {};
	const types = Object.keys(resources).sort();
	for (const type of types) {
		const names = type.split("_");
		if (names.length < minLevel) throw new Error(`Resource not properly namespaced: ${type}`);
		let current = grouped;
		let count = Math.min(maxLevel, names.length - 1);
		while (count--) {
			const ns = camelCase(names.shift());
			if (!current[ns]) current[ns] = {};
			current = current[ns];
		}
		const name = pascalCase(names.join("_"));
		current[name] = type;
	}
	return grouped;
};
const generateNamespace = (resources, render) => {
	const grouped = groupByNamespace(resources, 1, 2);
	const renderNamespace = (name, group, indent) => {
		if (name === "default") name = "$default";
		if (typeof group === "string") return render(name, resources[group], indent);
		return [
			`${tab(indent)}export ${indent === 0 ? "declare " : ""}namespace ${name.toLowerCase()} {`,
			Object.entries(group).map(([name$1, entry]) => {
				if (typeof entry !== "string") return renderNamespace(name$1, entry, indent + 1);
				else return render(name$1, resources[entry], indent + 1);
			}).join("\n"),
			`${tab(indent)}}`
		].join("\n");
	};
	return Object.entries(grouped).map(([name, entry]) => {
		return renderNamespace(name, entry, 0);
	});
};
const generateValue = (prop, ctx) => {
	if ([
		"string",
		"number",
		"boolean",
		"unknown"
	].includes(prop.type)) return ctx.wrap(prop.type, prop, ctx);
	if (prop.type === "array") {
		const type = generateValue(prop.item, {
			...ctx,
			depth: ctx.depth + 1
		});
		const array = ctx.readonly ? `ReadonlyArray<${type}>` : `Array<${type}>`;
		return ctx.wrap(array, prop, ctx);
	}
	if (prop.type === "record") {
		const type = generateValue(prop.item, {
			...ctx,
			depth: ctx.depth + 1
		});
		const record = ctx.readonly ? `Readonly<_Record<${type}>>` : `_Record<${type}>`;
		return ctx.wrap(record, prop, ctx);
	}
	if (prop.type === "object" || prop.type === "array-object") {
		const type = [
			"{",
			Object.entries(prop.properties).filter(([_, p]) => ctx.filter(p)).map(([name, prop$1]) => [
				prop$1.description ? [
					`\n`,
					`\t`.repeat(ctx.indent),
					`/** `,
					prop$1.description.trim(),
					" */",
					"\n"
				].join("") : "",
				`\t`.repeat(ctx.indent),
				camelCase(name),
				ctx.optional(prop$1, ctx) ? "?" : "",
				": ",
				generateValue(prop$1, {
					...ctx,
					indent: ctx.indent + 1,
					depth: ctx.depth + 1
				})
			].join("")).join("\n"),
			`${`\t`.repeat(ctx.indent - 1)}}`
		].join("\n");
		const object = ctx.readonly ? `Readonly<${type}>` : type;
		return ctx.wrap(object, prop, ctx);
	}
	throw new Error(`Unknown property type: ${prop.type}`);
};

//#endregion
//#region src/plugin/version/util.ts
const stableStringify = (value) => {
	return JSON.stringify(value, (_, item) => {
		if (item !== null && item instanceof Object && !Array.isArray(item)) return Object.keys(item).sort().reduce((sorted, key) => {
			sorted[key] = item[key];
			return sorted;
		}, {});
		return item;
	});
};
const sortStateValues = (values) => {
	return [...values].sort((left, right) => {
		const l = stableStringify(left);
		const r = stableStringify(right);
		if (l < r) return -1;
		if (l > r) return 1;
		return 0;
	});
};
const tryNormalizeJsonString = (value) => {
	const trimmed = value.trim();
	if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;
	try {
		return stableStringify(JSON.parse(trimmed));
	} catch {
		return value;
	}
};
const uniqueStateValues = (values) => {
	const seen = /* @__PURE__ */ new Set();
	return values.filter((value) => {
		const key = stableStringify(value);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};
const encodeDynamicValue = (value) => {
	return {
		msgpack: pack(value),
		json: value
	};
};
const decodeDynamicValue = (value) => {
	return unpack(value.msgpack);
};
const getResourceSchema = (resources, type) => {
	const resource = resources[type];
	if (!resource) throw new Error(`Unknown resource type: ${type}`);
	return resource;
};
const formatAttributePath = (state) => {
	if (!state) return [];
	return state.map((item) => {
		if (!item.steps) throw new Error("AttributePath should always have steps");
		return item.steps.map((attr) => {
			if ("attributeName" in attr) return attr.attributeName;
			if ("elementKeyString" in attr) return attr.elementKeyString;
			if ("elementKeyInt" in attr) return attr.elementKeyInt;
			throw new Error("AttributePath step should always have an element");
		});
	});
};
const getNestedValue = (obj, path) => {
	let current = obj;
	for (const key of path) {
		if (current === null || current === void 0) return current;
		if (Array.isArray(current)) current = current[key];
		else if (typeof current === "object") current = current[key];
		else return;
	}
	return current;
};
const filterRequiresReplace = (paths, priorState, proposedState) => {
	return paths.filter((path) => {
		const priorValue = getNestedValue(priorState, path);
		const proposedValue = getNestedValue(proposedState, path);
		return JSON.stringify(priorValue) !== JSON.stringify(proposedValue);
	});
};
var IncorrectType = class extends TypeError {
	constructor(type, path) {
		super(`${path.join(".")} should be a ${type}`);
	}
};
const isEmptyOutputValue = (value) => {
	if (value === null || typeof value === "undefined") return true;
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object") return Object.keys(value).length === 0;
	return false;
};
const shouldOmitOutputValue = (schema, value) => {
	if (!(schema.optional || schema.computed)) return false;
	return isEmptyOutputValue(value);
};
const hasInputValue = (value) => typeof value !== "undefined";
const shouldIncludeFieldForComparison = (schema, inputValue) => {
	return schema.required || hasInputValue(inputValue);
};
const isContainerSchema = (schema) => {
	return [
		"array",
		"record",
		"object",
		"array-object"
	].includes(schema.type);
};
const isEmptyStructuralInput = (value) => {
	if (value === null || typeof value === "undefined") return true;
	if (Array.isArray(value)) return value.length === 0 || value.every((item) => isEmptyStructuralInput(item));
	if (typeof value === "object") {
		const entries = Object.values(value);
		return entries.length === 0 || entries.every((item) => isEmptyStructuralInput(item));
	}
	return false;
};
const normalizeStateForComparison = (schema, state, inputState, allowStructuralFallback = true) => {
	if (!shouldIncludeFieldForComparison(schema, inputState)) return;
	if (allowStructuralFallback && (state === null || typeof state === "undefined") && isContainerSchema(schema) && isEmptyStructuralInput(inputState)) state = inputState;
	if (state === null || typeof state === "undefined") return state;
	if (schema.type === "array") {
		if (!Array.isArray(state)) return state;
		const filtered = state.map((item, index) => {
			const inputItem = Array.isArray(inputState) ? inputState[index] : void 0;
			return normalizeStateForComparison(schema.item, item, inputItem, allowStructuralFallback);
		}).filter((item) => typeof item !== "undefined");
		if (schema.collectionKind === "set") return sortStateValues(uniqueStateValues(filtered.filter((item) => item !== null)));
		return filtered;
	}
	if (schema.type === "record") {
		if (typeof state !== "object" || state === null) return state;
		return Object.fromEntries(Object.entries(state).flatMap(([key, value]) => {
			const inputValue = inputState && typeof inputState === "object" ? inputState[key] : void 0;
			const normalized = normalizeStateForComparison(schema.item, value, inputValue, allowStructuralFallback);
			if (typeof normalized === "undefined") return [];
			return [[key, normalized]];
		}));
	}
	if (schema.type === "object") {
		if (typeof state !== "object" || state === null) return state;
		const normalized = Object.fromEntries(Object.entries(schema.properties).flatMap(([key, prop]) => {
			const stateValue = state[camelCase(key)];
			const normalized$1 = normalizeStateForComparison(prop, stateValue, inputState && typeof inputState === "object" ? inputState[camelCase(key)] : void 0, allowStructuralFallback);
			if (typeof normalized$1 === "undefined") return [];
			return [[camelCase(key), normalized$1]];
		}));
		if (allowStructuralFallback && Object.keys(normalized).length === 0 && isEmptyStructuralInput(inputState)) return normalizeStateForComparison(schema, inputState, inputState, false);
		return normalized;
	}
	if (schema.type === "array-object") {
		if (typeof state !== "object" || state === null) return state;
		const normalized = Object.fromEntries(Object.entries(schema.properties).flatMap(([key, prop]) => {
			const stateValue = state[camelCase(key)];
			const normalized$1 = normalizeStateForComparison(prop, stateValue, inputState && typeof inputState === "object" ? inputState[camelCase(key)] : void 0, allowStructuralFallback);
			if (typeof normalized$1 === "undefined") return [];
			return [[camelCase(key), normalized$1]];
		}));
		if (allowStructuralFallback && Object.keys(normalized).length === 0 && isEmptyStructuralInput(inputState)) return normalizeStateForComparison(schema, inputState, inputState, false);
		return normalized;
	}
	if (schema.type === "string") {
		if (typeof state === "string") return tryNormalizeJsonString(state);
	}
	return state;
};
const formatInputState = (schema, state, includeSchemaFields = true, path = []) => {
	if (state === null) return null;
	if (typeof state === "undefined") return null;
	if (schema.type === "unknown") return state;
	if (schema.type === "string") {
		if (typeof state === "string") return state;
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "number") {
		if (typeof state === "number") return state;
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "boolean") {
		if (typeof state === "boolean") return state;
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "array") {
		if (Array.isArray(state)) return state.map((item, i) => formatInputState(schema.item, item, includeSchemaFields, [...path, i]));
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "record") {
		if (typeof state === "object" && state !== null) {
			const record = {};
			for (const [key, value] of Object.entries(state)) record[key] = formatInputState(schema.item, value, includeSchemaFields, [...path, key]);
			return record;
		}
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "object" || schema.type === "array-object") {
		if (typeof state === "object" && state !== null) {
			const object = {};
			if (includeSchemaFields) for (const [key, prop] of Object.entries(schema.properties)) {
				const value = state[camelCase(key)];
				object[key] = formatInputState(prop, value, true, [...path, key]);
			}
			else for (const [key, value] of Object.entries(state)) {
				const prop = schema.properties[snakeCase(key)];
				if (prop) object[key] = formatInputState(prop, value, false, [...path, key]);
			}
			if (schema.type === "array-object") return [object];
			return object;
		}
		throw new IncorrectType(schema.type, path);
	}
	throw new Error(`Unknown schema type: ${schema.type}`);
};
const formatOutputState = (schema, state, path = []) => {
	if (state === null || state === void 0) return null;
	if (schema.type === "array") {
		if (Array.isArray(state)) return state.map((item, i) => formatOutputState(schema.item, item, [...path, i]));
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "record") {
		if (typeof state === "object" && state !== null) {
			const record = {};
			for (const [key, value] of Object.entries(state)) record[key] = formatOutputState(schema.item, value, [...path, key]);
			return record;
		}
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "object") {
		if (typeof state === "object" && state !== null) {
			const object = {};
			for (const [key, prop] of Object.entries(schema.properties)) {
				const value = state[key];
				const formatted = formatOutputState(prop, value, [...path, key]);
				if (shouldOmitOutputValue(prop, formatted)) continue;
				object[camelCase(key)] = formatted;
			}
			return object;
		}
		throw new IncorrectType(schema.type, path);
	}
	if (schema.type === "array-object") {
		if (Array.isArray(state)) if (state.length === 1) {
			const object = {};
			for (const [key, prop] of Object.entries(schema.properties)) {
				const value = state[0][key];
				const formatted = formatOutputState(prop, value, [...path, key]);
				if (shouldOmitOutputValue(prop, formatted)) continue;
				object[camelCase(key)] = formatted;
			}
			return object;
		} else return null;
		throw new IncorrectType(schema.type, path);
	}
	return state;
};

//#endregion
//#region src/provider.ts
var TerraformProvider = class {
	configured;
	plugin;
	constructor(type, id, createPlugin, config) {
		this.type = type;
		this.id = id;
		this.createPlugin = createPlugin;
		this.config = config;
	}
	async configure() {
		const plugin = await this.prepare();
		if (!this.configured) this.configured = plugin.configure(this.config);
		await this.configured;
		return plugin;
	}
	prepare() {
		if (!this.plugin) this.plugin = this.createPlugin();
		return this.plugin;
	}
	async destroy() {
		if (this.plugin) {
			(await this.plugin).stop();
			this.plugin = void 0;
			this.configured = void 0;
		}
	}
	ownResource(id) {
		return `terraform:${this.type}:${this.id}` === id;
	}
	async getResource({ type, state }) {
		const newState = await (await this.configure()).readResource(type, state);
		if (!newState) throw new ResourceNotFound();
		return {
			version: 0,
			state: newState
		};
	}
	async createResource({ type, state }) {
		return {
			version: 0,
			state: await (await this.configure()).applyResourceChange(type, null, state, state)
		};
	}
	async updateResource({ type, priorState, proposedState }) {
		const plugin = await this.configure();
		const mergedState = {
			...priorState,
			...proposedState
		};
		const { requiresReplace, plannedState } = await plugin.planResourceChange(type, priorState, mergedState, proposedState);
		if (requiresReplace.length > 0) {
			const formattedAttrs = requiresReplace.map((p) => p.join(".")).join("\", \"");
			throw new Error(`Updating the "${formattedAttrs}" properties for the "${type}" resource will require the resource to be replaced.`);
		}
		return {
			version: 0,
			state: await plugin.applyResourceChange(type, priorState, plannedState, proposedState)
		};
	}
	async deleteResource({ type, state }) {
		const plugin = await this.configure();
		try {
			await plugin.applyResourceChange(type, state, null, null);
		} catch (error) {
			try {
				if (!await plugin.readResource(type, state)) throw new ResourceNotFound();
			} catch (_) {}
			throw error;
		}
	}
	async planResourceChange({ type, priorState, proposedState }) {
		const plugin = await this.configure();
		const mergedState = {
			...priorState,
			...proposedState
		};
		const result = await plugin.planResourceChange(type, priorState, mergedState, proposedState);
		return {
			version: 0,
			requiresReplacement: result.requiresReplace.length > 0,
			state: result.plannedState
		};
	}
	async getData({ type, state }) {
		const data = await (await this.configure()).readDataSource(type, state);
		if (!data) throw new Error(`Data source not found ${type}`);
		return { state: data };
	}
	async refreshResource({ type, priorInputState, priorOutputState }) {
		const plugin = await this.configure();
		const schema = getResourceSchema(plugin.schema().resources, type);
		const refreshedState = await plugin.readResource(type, priorOutputState);
		if (!refreshedState) return { kind: "deleted" };
		const normalizedPriorInputState = normalizeStateForComparison(schema, priorInputState, priorInputState);
		const normalizedRefreshedState = normalizeStateForComparison(schema, refreshedState, priorInputState);
		if (stableStringify(normalizedPriorInputState) === stableStringify(normalizedRefreshedState)) return {
			kind: "unchanged",
			state: refreshedState
		};
		return {
			kind: "updated",
			state: refreshedState,
			inputState: normalizedRefreshedState
		};
	}
};

//#endregion
//#region src/plugin/diagnostic.ts
var DiagnosticsError = class extends Error {
	constructor(diagnostics) {
		super(formatDiagnosticErrorMessage(diagnostics));
		this.diagnostics = diagnostics;
	}
};
const formatDiagnosticErrorMessage = (diagnostics) => {
	if (diagnostics.length === 0) return "Unknown diagnostic error";
	const diagnostic = diagnostics[0];
	if (diagnostic.detail) return `${diagnostic.summary}\n\n${diagnostic.detail}`;
	return diagnostic.summary;
};
const throwDiagnosticError = (response) => {
	return new DiagnosticsError(response.diagnostics.map((item) => ({
		severity: item.severity === 1 ? "error" : "warning",
		summary: item.summary,
		detail: item.detail,
		path: item.attribute?.steps.map((step) => step.attributeName)
	})));
};

//#endregion
//#region src/plugin/protocol/tfplugin5.ts
var tfplugin5_default = {
	options: { syntax: "proto3" },
	nested: { tfplugin5: { nested: {
		DynamicValue: { fields: {
			msgpack: {
				type: "bytes",
				id: 1
			},
			json: {
				type: "bytes",
				id: 2
			}
		} },
		Diagnostic: {
			fields: {
				severity: {
					type: "Severity",
					id: 1
				},
				summary: {
					type: "string",
					id: 2
				},
				detail: {
					type: "string",
					id: 3
				},
				attribute: {
					type: "AttributePath",
					id: 4
				}
			},
			nested: { Severity: { values: {
				INVALID: 0,
				ERROR: 1,
				WARNING: 2
			} } }
		},
		AttributePath: {
			fields: { steps: {
				rule: "repeated",
				type: "Step",
				id: 1
			} },
			nested: { Step: {
				oneofs: { selector: { oneof: [
					"attributeName",
					"elementKeyString",
					"elementKeyInt"
				] } },
				fields: {
					attributeName: {
						type: "string",
						id: 1
					},
					elementKeyString: {
						type: "string",
						id: 2
					},
					elementKeyInt: {
						type: "int64",
						id: 3
					}
				}
			} }
		},
		Stop: {
			fields: {},
			nested: {
				Request: { fields: {} },
				Response: { fields: { Error: {
					type: "string",
					id: 1
				} } }
			}
		},
		RawState: { fields: {
			json: {
				type: "bytes",
				id: 1
			},
			flatmap: {
				keyType: "string",
				type: "string",
				id: 2
			}
		} },
		Schema: {
			fields: {
				version: {
					type: "int64",
					id: 1
				},
				block: {
					type: "Block",
					id: 2
				}
			},
			nested: {
				Block: { fields: {
					version: {
						type: "int64",
						id: 1
					},
					attributes: {
						rule: "repeated",
						type: "Attribute",
						id: 2
					},
					blockTypes: {
						rule: "repeated",
						type: "NestedBlock",
						id: 3
					}
				} },
				Attribute: { fields: {
					name: {
						type: "string",
						id: 1
					},
					type: {
						type: "bytes",
						id: 2
					},
					description: {
						type: "string",
						id: 3
					},
					required: {
						type: "bool",
						id: 4
					},
					optional: {
						type: "bool",
						id: 5
					},
					computed: {
						type: "bool",
						id: 6
					},
					sensitive: {
						type: "bool",
						id: 7
					}
				} },
				NestedBlock: {
					fields: {
						typeName: {
							type: "string",
							id: 1
						},
						block: {
							type: "Block",
							id: 2
						},
						nesting: {
							type: "NestingMode",
							id: 3
						},
						minItems: {
							type: "int64",
							id: 4
						},
						maxItems: {
							type: "int64",
							id: 5
						}
					},
					nested: { NestingMode: { values: {
						INVALID: 0,
						SINGLE: 1,
						LIST: 2,
						SET: 3,
						MAP: 4,
						GROUP: 5
					} } }
				}
			}
		},
		Provider: { methods: {
			GetSchema: {
				requestType: "GetProviderSchema.Request",
				responseType: "GetProviderSchema.Response"
			},
			PrepareProviderConfig: {
				requestType: "PrepareProviderConfig.Request",
				responseType: "PrepareProviderConfig.Response"
			},
			ValidateResourceTypeConfig: {
				requestType: "ValidateResourceTypeConfig.Request",
				responseType: "ValidateResourceTypeConfig.Response"
			},
			ValidateDataSourceConfig: {
				requestType: "ValidateDataSourceConfig.Request",
				responseType: "ValidateDataSourceConfig.Response"
			},
			UpgradeResourceState: {
				requestType: "UpgradeResourceState.Request",
				responseType: "UpgradeResourceState.Response"
			},
			Configure: {
				requestType: "Configure.Request",
				responseType: "Configure.Response"
			},
			ReadResource: {
				requestType: "ReadResource.Request",
				responseType: "ReadResource.Response"
			},
			PlanResourceChange: {
				requestType: "PlanResourceChange.Request",
				responseType: "PlanResourceChange.Response"
			},
			ApplyResourceChange: {
				requestType: "ApplyResourceChange.Request",
				responseType: "ApplyResourceChange.Response"
			},
			ImportResourceState: {
				requestType: "ImportResourceState.Request",
				responseType: "ImportResourceState.Response"
			},
			ReadDataSource: {
				requestType: "ReadDataSource.Request",
				responseType: "ReadDataSource.Response"
			},
			Stop: {
				requestType: "Stop.Request",
				responseType: "Stop.Response"
			}
		} },
		GetProviderSchema: {
			fields: {},
			nested: {
				Request: { fields: {} },
				Response: { fields: {
					provider: {
						type: "Schema",
						id: 1
					},
					resourceSchemas: {
						keyType: "string",
						type: "Schema",
						id: 2
					},
					dataSourceSchemas: {
						keyType: "string",
						type: "Schema",
						id: 3
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 4
					}
				} }
			}
		},
		PrepareProviderConfig: {
			fields: {},
			nested: {
				Request: { fields: { config: {
					type: "DynamicValue",
					id: 1
				} } },
				Response: { fields: {
					preparedConfig: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		UpgradeResourceState: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					version: {
						type: "int64",
						id: 2
					},
					rawState: {
						type: "RawState",
						id: 3
					}
				} },
				Response: { fields: {
					upgradedState: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		ValidateResourceTypeConfig: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ValidateDataSourceConfig: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		Configure: {
			fields: {},
			nested: {
				Request: { fields: {
					terraformVersion: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ReadResource: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					currentState: {
						type: "DynamicValue",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					}
				} },
				Response: { fields: {
					newState: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					}
				} }
			}
		},
		PlanResourceChange: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					priorState: {
						type: "DynamicValue",
						id: 2
					},
					proposedNewState: {
						type: "DynamicValue",
						id: 3
					},
					config: {
						type: "DynamicValue",
						id: 4
					},
					priorPrivate: {
						type: "bytes",
						id: 5
					}
				} },
				Response: { fields: {
					plannedState: {
						type: "DynamicValue",
						id: 1
					},
					requiresReplace: {
						rule: "repeated",
						type: "AttributePath",
						id: 2
					},
					plannedPrivate: {
						type: "bytes",
						id: 3
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 4
					},
					legacyTypeSystem: {
						type: "bool",
						id: 5
					}
				} }
			}
		},
		ApplyResourceChange: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					priorState: {
						type: "DynamicValue",
						id: 2
					},
					plannedState: {
						type: "DynamicValue",
						id: 3
					},
					config: {
						type: "DynamicValue",
						id: 4
					},
					plannedPrivate: {
						type: "bytes",
						id: 5
					}
				} },
				Response: { fields: {
					newState: {
						type: "DynamicValue",
						id: 1
					},
					private: {
						type: "bytes",
						id: 2
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 3
					},
					legacyTypeSystem: {
						type: "bool",
						id: 4
					}
				} }
			}
		},
		ImportResourceState: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					id: {
						type: "string",
						id: 2
					}
				} },
				ImportedResource: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					state: {
						type: "DynamicValue",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					}
				} },
				Response: { fields: {
					importedResources: {
						rule: "repeated",
						type: "ImportedResource",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		ReadDataSource: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: {
					state: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		Provisioner: { methods: {
			GetSchema: {
				requestType: "GetProvisionerSchema.Request",
				responseType: "GetProvisionerSchema.Response"
			},
			ValidateProvisionerConfig: {
				requestType: "ValidateProvisionerConfig.Request",
				responseType: "ValidateProvisionerConfig.Response"
			},
			ProvisionResource: {
				requestType: "ProvisionResource.Request",
				responseType: "ProvisionResource.Response",
				responseStream: true
			},
			Stop: {
				requestType: "Stop.Request",
				responseType: "Stop.Response"
			}
		} },
		GetProvisionerSchema: {
			fields: {},
			nested: {
				Request: { fields: {} },
				Response: { fields: {
					provisioner: {
						type: "Schema",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		ValidateProvisionerConfig: {
			fields: {},
			nested: {
				Request: { fields: { config: {
					type: "DynamicValue",
					id: 1
				} } },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ProvisionResource: {
			fields: {},
			nested: {
				Request: { fields: {
					config: {
						type: "DynamicValue",
						id: 1
					},
					connection: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: {
					output: {
						type: "string",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		}
	} } }
};

//#endregion
//#region src/plugin/protocol/tfplugin6.ts
var tfplugin6_default = {
	options: {
		syntax: "proto3",
		go_package: "github.com/hashicorp/terraform/internal/tfplugin6"
	},
	nested: { tfplugin6: { nested: {
		DynamicValue: { fields: {
			msgpack: {
				type: "bytes",
				id: 1
			},
			json: {
				type: "bytes",
				id: 2
			}
		} },
		Diagnostic: {
			fields: {
				severity: {
					type: "Severity",
					id: 1
				},
				summary: {
					type: "string",
					id: 2
				},
				detail: {
					type: "string",
					id: 3
				},
				attribute: {
					type: "AttributePath",
					id: 4
				}
			},
			nested: { Severity: { values: {
				INVALID: 0,
				ERROR: 1,
				WARNING: 2
			} } }
		},
		AttributePath: {
			fields: { steps: {
				rule: "repeated",
				type: "Step",
				id: 1
			} },
			nested: { Step: {
				oneofs: { selector: { oneof: [
					"attributeName",
					"elementKeyString",
					"elementKeyInt"
				] } },
				fields: {
					attributeName: {
						type: "string",
						id: 1
					},
					elementKeyString: {
						type: "string",
						id: 2
					},
					elementKeyInt: {
						type: "int64",
						id: 3
					}
				}
			} }
		},
		StopProvider: {
			fields: {},
			nested: {
				Request: { fields: {} },
				Response: { fields: { Error: {
					type: "string",
					id: 1
				} } }
			}
		},
		RawState: { fields: {
			json: {
				type: "bytes",
				id: 1
			},
			flatmap: {
				keyType: "string",
				type: "string",
				id: 2
			}
		} },
		StringKind: { values: {
			PLAIN: 0,
			MARKDOWN: 1
		} },
		Schema: {
			fields: {
				version: {
					type: "int64",
					id: 1
				},
				block: {
					type: "Block",
					id: 2
				}
			},
			nested: {
				Block: { fields: {
					version: {
						type: "int64",
						id: 1
					},
					attributes: {
						rule: "repeated",
						type: "Attribute",
						id: 2
					},
					blockTypes: {
						rule: "repeated",
						type: "NestedBlock",
						id: 3
					},
					description: {
						type: "string",
						id: 4
					},
					descriptionKind: {
						type: "StringKind",
						id: 5
					},
					deprecated: {
						type: "bool",
						id: 6
					}
				} },
				Attribute: { fields: {
					name: {
						type: "string",
						id: 1
					},
					type: {
						type: "bytes",
						id: 2
					},
					nestedType: {
						type: "Object",
						id: 10
					},
					description: {
						type: "string",
						id: 3
					},
					required: {
						type: "bool",
						id: 4
					},
					optional: {
						type: "bool",
						id: 5
					},
					computed: {
						type: "bool",
						id: 6
					},
					sensitive: {
						type: "bool",
						id: 7
					},
					descriptionKind: {
						type: "StringKind",
						id: 8
					},
					deprecated: {
						type: "bool",
						id: 9
					}
				} },
				NestedBlock: {
					fields: {
						typeName: {
							type: "string",
							id: 1
						},
						block: {
							type: "Block",
							id: 2
						},
						nesting: {
							type: "NestingMode",
							id: 3
						},
						minItems: {
							type: "int64",
							id: 4
						},
						maxItems: {
							type: "int64",
							id: 5
						}
					},
					nested: { NestingMode: { values: {
						INVALID: 0,
						SINGLE: 1,
						LIST: 2,
						SET: 3,
						MAP: 4,
						GROUP: 5
					} } }
				},
				Object: {
					fields: {
						attributes: {
							rule: "repeated",
							type: "Attribute",
							id: 1
						},
						nesting: {
							type: "NestingMode",
							id: 3
						},
						minItems: {
							type: "int64",
							id: 4
						},
						maxItems: {
							type: "int64",
							id: 5
						}
					},
					nested: { NestingMode: { values: {
						INVALID: 0,
						SINGLE: 1,
						LIST: 2,
						SET: 3,
						MAP: 4
					} } }
				}
			}
		},
		Provider: { methods: {
			GetProviderSchema: {
				requestType: "GetProviderSchema.Request",
				responseType: "GetProviderSchema.Response"
			},
			ValidateProviderConfig: {
				requestType: "ValidateProviderConfig.Request",
				responseType: "ValidateProviderConfig.Response"
			},
			ValidateResourceConfig: {
				requestType: "ValidateResourceConfig.Request",
				responseType: "ValidateResourceConfig.Response"
			},
			ValidateDataResourceConfig: {
				requestType: "ValidateDataResourceConfig.Request",
				responseType: "ValidateDataResourceConfig.Response"
			},
			UpgradeResourceState: {
				requestType: "UpgradeResourceState.Request",
				responseType: "UpgradeResourceState.Response"
			},
			ConfigureProvider: {
				requestType: "ConfigureProvider.Request",
				responseType: "ConfigureProvider.Response"
			},
			ReadResource: {
				requestType: "ReadResource.Request",
				responseType: "ReadResource.Response"
			},
			PlanResourceChange: {
				requestType: "PlanResourceChange.Request",
				responseType: "PlanResourceChange.Response"
			},
			ApplyResourceChange: {
				requestType: "ApplyResourceChange.Request",
				responseType: "ApplyResourceChange.Response"
			},
			ImportResourceState: {
				requestType: "ImportResourceState.Request",
				responseType: "ImportResourceState.Response"
			},
			ReadDataSource: {
				requestType: "ReadDataSource.Request",
				responseType: "ReadDataSource.Response"
			},
			StopProvider: {
				requestType: "StopProvider.Request",
				responseType: "StopProvider.Response"
			}
		} },
		GetProviderSchema: {
			fields: {},
			nested: {
				Request: { fields: {} },
				Response: { fields: {
					provider: {
						type: "Schema",
						id: 1
					},
					resourceSchemas: {
						keyType: "string",
						type: "Schema",
						id: 2
					},
					dataSourceSchemas: {
						keyType: "string",
						type: "Schema",
						id: 3
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 4
					},
					providerMeta: {
						type: "Schema",
						id: 5
					}
				} }
			}
		},
		ValidateProviderConfig: {
			fields: {},
			nested: {
				Request: { fields: { config: {
					type: "DynamicValue",
					id: 1
				} } },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 2
				} } }
			}
		},
		UpgradeResourceState: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					version: {
						type: "int64",
						id: 2
					},
					rawState: {
						type: "RawState",
						id: 3
					}
				} },
				Response: { fields: {
					upgradedState: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		ValidateResourceConfig: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ValidateDataResourceConfig: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ConfigureProvider: {
			fields: {},
			nested: {
				Request: { fields: {
					terraformVersion: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					}
				} },
				Response: { fields: { diagnostics: {
					rule: "repeated",
					type: "Diagnostic",
					id: 1
				} } }
			}
		},
		ReadResource: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					currentState: {
						type: "DynamicValue",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					},
					providerMeta: {
						type: "DynamicValue",
						id: 4
					}
				} },
				Response: { fields: {
					newState: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					}
				} }
			}
		},
		PlanResourceChange: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					priorState: {
						type: "DynamicValue",
						id: 2
					},
					proposedNewState: {
						type: "DynamicValue",
						id: 3
					},
					config: {
						type: "DynamicValue",
						id: 4
					},
					priorPrivate: {
						type: "bytes",
						id: 5
					},
					providerMeta: {
						type: "DynamicValue",
						id: 6
					}
				} },
				Response: { fields: {
					plannedState: {
						type: "DynamicValue",
						id: 1
					},
					requiresReplace: {
						rule: "repeated",
						type: "AttributePath",
						id: 2
					},
					plannedPrivate: {
						type: "bytes",
						id: 3
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 4
					}
				} }
			}
		},
		ApplyResourceChange: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					priorState: {
						type: "DynamicValue",
						id: 2
					},
					plannedState: {
						type: "DynamicValue",
						id: 3
					},
					config: {
						type: "DynamicValue",
						id: 4
					},
					plannedPrivate: {
						type: "bytes",
						id: 5
					},
					providerMeta: {
						type: "DynamicValue",
						id: 6
					}
				} },
				Response: { fields: {
					newState: {
						type: "DynamicValue",
						id: 1
					},
					private: {
						type: "bytes",
						id: 2
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 3
					}
				} }
			}
		},
		ImportResourceState: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					id: {
						type: "string",
						id: 2
					}
				} },
				ImportedResource: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					state: {
						type: "DynamicValue",
						id: 2
					},
					private: {
						type: "bytes",
						id: 3
					}
				} },
				Response: { fields: {
					importedResources: {
						rule: "repeated",
						type: "ImportedResource",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		},
		ReadDataSource: {
			fields: {},
			nested: {
				Request: { fields: {
					typeName: {
						type: "string",
						id: 1
					},
					config: {
						type: "DynamicValue",
						id: 2
					},
					providerMeta: {
						type: "DynamicValue",
						id: 3
					}
				} },
				Response: { fields: {
					state: {
						type: "DynamicValue",
						id: 1
					},
					diagnostics: {
						rule: "repeated",
						type: "Diagnostic",
						id: 2
					}
				} }
			}
		}
	} } }
};

//#endregion
//#region src/plugin/client.ts
const debug$2 = createDebugger("Client");
const protocols = {
	tfplugin5: tfplugin5_default,
	tfplugin6: tfplugin6_default
};
const createPluginClient = async (props) => {
	const proto = protocols[props.protocol.split(".").at(0) ?? ""];
	if (!proto) throw new Error(`We don't have support for the ${props.protocol} protocol`);
	/** @ts-ignore */
	const client = new (loadPackageDefinition(fromJSON(proto)))["tfplugin" + props.version].Provider(`unix://${props.endpoint}`, credentials.createInsecure(), {
		"grpc.max_receive_message_length": 100 * 1024 * 1024,
		"grpc.max_send_message_length": 100 * 1024 * 1024
	});
	debug$2("init", props.protocol);
	await new Promise((resolve, reject) => {
		const deadline = /* @__PURE__ */ new Date();
		deadline.setSeconds(deadline.getSeconds() + 10);
		client.waitForReady(deadline, (error) => {
			if (error) reject(error);
			else resolve();
		});
	});
	debug$2("connected");
	return { call(method, payload) {
		return new Promise((resolve, reject) => {
			const fn = client[method];
			debug$2("call", method);
			if (!fn) {
				reject(/* @__PURE__ */ new Error(`Unknown method call: ${method}`));
				return;
			}
			fn.call(client, payload, (error, response) => {
				if (error) {
					debug$2("failed", error);
					reject(error);
				} else if (response.diagnostics) {
					debug$2("failed", response.diagnostics);
					reject(throwDiagnosticError(response));
				} else resolve(response);
			});
		});
	} };
};

//#endregion
//#region src/plugin/registry.ts
const baseUrl = "https://registry.terraform.io/v1/providers";
const getProviderVersions = async (org, type) => {
	const versions = (await (await fetch(`${baseUrl}/${org}/${type}/versions`)).json()).versions;
	const os = getOS();
	const ar = getArchitecture();
	const supported = versions.filter((v) => {
		return !!v.platforms.find((p) => p.os === os && p.arch === ar);
	});
	const latest = supported.sort((a, b) => compare(a.version, b.version)).at(-1);
	if (!latest) throw new Error("Version is unsupported for your platform.");
	return {
		versions,
		supported,
		latest: latest.version
	};
};
const getProviderDownloadUrl = async (org, type, version) => {
	const url = [
		baseUrl,
		org,
		type,
		version,
		"download",
		getOS(),
		getArchitecture()
	].join("/");
	const result = await (await fetch(url)).json();
	return {
		url: result.download_url,
		shasum: result.shasum,
		protocols: result.protocols
	};
};
const getOS = () => {
	const os = platform();
	switch (os) {
		case "linux": return "linux";
		case "win32": return "windows";
		case "darwin": return "darwin";
		case "freebsd": return "freebsd";
		case "openbsd": return "openbsd";
	}
	throw new Error(`Unsupported OS platform: ${os}`);
};
const getArchitecture = () => {
	const ar = arch();
	switch (ar) {
		case "arm": return "arm";
		case "arm64": return "arm64";
		case "x64": return "amd64";
		case "ia32": return "386";
	}
	throw new Error(`Unsupported architecture: ${ar}`);
};

//#endregion
//#region src/plugin/download.ts
const exists = async (file) => {
	try {
		await stat(file);
	} catch (error) {
		return false;
	}
	return true;
};
const debug$1 = createDebugger("Downloader");
const installPath = join(homedir(), ".terraforge", "plugins");
const getInstallPath = (props) => {
	return join(props.location ?? installPath, `${props.org}-${props.type}-${props.version}`);
};
const isPluginInstalled = (props) => {
	return exists(getInstallPath(props));
};
const deletePlugin = async (props) => {
	const file = getInstallPath(props);
	if (await isPluginInstalled(props)) {
		debug$1(props.type, "deleting...");
		await rm(file);
		debug$1(props.type, "deleted");
	} else debug$1(props.type, "not installed");
};
const downloadPlugin = async (props) => {
	if (props.version === "latest") {
		const { latest } = await getProviderVersions(props.org, props.type);
		props.version = latest;
	}
	const file = getInstallPath(props);
	if (!await isPluginInstalled(props)) {
		debug$1(props.type, "downloading...");
		const info = await getProviderDownloadUrl(props.org, props.type, props.version);
		const buf = await (await fetch(info.url)).bytes();
		const zipped = (await jszip.loadAsync(buf)).filter((file$1) => file$1.startsWith("terraform-provider")).at(0);
		if (!zipped) throw new Error(`Can't find the provider inside the downloaded zip file.`);
		const binary = await zipped.async("nodebuffer");
		debug$1(props.type, "done");
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, binary, { mode: 509 });
	} else debug$1(props.type, "already downloaded");
	return {
		file,
		version: props.version
	};
};

//#endregion
//#region src/plugin/server.ts
const debug = createDebugger("Server");
const createPluginServer = (props) => {
	return new Promise((resolve, reject) => {
		debug("init");
		const process = spawn(`${props.file}`, ["-debug"]);
		process.stderr.on("data", (data) => {
			if (props.debug) {
				const message = data.toString("utf8");
				console.log(message);
			}
		});
		process.stdout.once("data", (data) => {
			try {
				const matches = data.toString("utf8").match(/TF_REATTACH_PROVIDERS\=\'(.*)\'/);
				if (matches && matches.length > 0) {
					const json = matches[0].slice(23, -1);
					const data$1 = JSON.parse(json);
					const entries = Object.values(data$1);
					if (entries.length > 0) {
						const entry = entries[0];
						const version = entry.ProtocolVersion;
						const endpoint = entry.Addr.String;
						debug("started", endpoint);
						resolve({
							kill() {
								process.kill();
							},
							protocol: "tfplugin" + version.toFixed(1),
							version,
							endpoint
						});
						return;
					}
				}
			} catch (error) {}
			debug("failed");
			reject(/* @__PURE__ */ new Error("Failed to start the plugin"));
		});
	});
};

//#endregion
//#region src/plugin/schema.ts
const NestingMode = {
	INVALID: 0,
	SINGLE: 1,
	LIST: 2,
	SET: 3,
	MAP: 4,
	GROUP: 5
};
const parseResourceSchema = (schemas) => {
	const props = {};
	for (const [name, schema] of Object.entries(schemas)) if (schema.block) {
		const block = parseBlock(schema.block);
		props[name] = {
			...block,
			version: block.version ?? schema.version
		};
	}
	return props;
};
const parseProviderSchema = (schema) => {
	if (schema.block) {
		const block = parseBlock(schema.block);
		return {
			...block,
			version: block.version ?? schema.version
		};
	}
	throw new Error("Invalid block");
};
const parseBlock = (block) => {
	const properties = {};
	for (const entry of block.attributes ?? []) properties[entry.name] = parseAttribute(entry);
	for (const entry of block.blockTypes ?? []) properties[entry.typeName] = parseNestedBlock(entry);
	if (block.deprecated) console.warn("Deprecated block");
	return {
		type: "object",
		version: block.version,
		description: block.description,
		properties
	};
};
const parseNestedBlock = (block) => {
	const type = parseNestedBlockType(block);
	const item = parseBlock(block.block);
	const prop = {
		optional: true,
		required: false,
		computed: false
	};
	if (type === "array" || type === "record") return {
		...prop,
		type,
		item,
		collectionKind: block.nesting === NestingMode.SET ? "set" : "list"
	};
	if (type === "array-object") return {
		...prop,
		...item,
		type
	};
	return {
		...prop,
		...item
	};
};
const parseNestedBlockType = (block) => {
	if (block.nesting === NestingMode.SET) return "array";
	if (block.nesting === NestingMode.LIST) {
		if (block.maxItems?.eq(1)) return "array-object";
		return "array";
	}
	if (block.nesting === NestingMode.MAP) return "record";
	if (block.nesting === NestingMode.GROUP) return "object";
	if (block.nesting === NestingMode.SINGLE) return "object";
	throw new Error(`Invalid nested block type ${block.nesting}`);
};
const parseAttribute = (attr) => {
	const prop = {
		description: attr.description,
		required: attr.required,
		optional: attr.optional,
		computed: attr.computed,
		deprecated: attr.deprecated,
		sensitive: attr.sensitive
	};
	if (attr.type) {
		const json = JSON.parse(attr.type.toString("utf8"));
		return {
			...prop,
			...parseAttributeType(json)
		};
	}
	if (attr.nestedType) return {
		...prop,
		...parseBlock(attr.nestedType)
	};
	throw new Error("Empty attr");
};
const parseAttributeType = (item) => {
	if (Array.isArray(item)) {
		const sourceType = item[0];
		const type$1 = parseType(sourceType);
		if (type$1 === "array" || type$1 === "record" && item) {
			const record = item[1];
			return {
				type: type$1,
				item: parseAttributeType(record),
				collectionKind: sourceType === "set" ? "set" : "list"
			};
		}
		if (type$1 === "object") {
			const object = item[1];
			const properties = {};
			for (const [name, prop] of Object.entries(object)) properties[name] = parseAttributeType(prop);
			return {
				type: type$1,
				properties
			};
		}
		throw new Error("Invalid attribute type");
	}
	const type = parseType(item);
	if (isLeafType(type)) return { type };
	throw new Error(`Invalid attribute type`);
};
const isLeafType = (type) => {
	return [
		"string",
		"number",
		"boolean",
		"unknown"
	].includes(type);
};
const parseType = (type) => {
	if (type === "string") return "string";
	if (type === "number") return "number";
	if (type === "bool") return "boolean";
	if (["set", "list"].includes(type)) return "array";
	if (type === "object") return "object";
	if (type === "map") return "record";
	if (type === "dynamic") return "unknown";
	throw new Error(`Invalid type: ${type}`);
};

//#endregion
//#region src/plugin/version/5.ts
const createPlugin5 = async ({ server, client }) => {
	const schema = await client.call("GetSchema");
	const provider = parseProviderSchema(schema.provider);
	const resources = parseResourceSchema(schema.resourceSchemas);
	const dataSources = parseResourceSchema(schema.dataSourceSchemas);
	return {
		schema() {
			return {
				provider,
				resources,
				dataSources
			};
		},
		async stop() {
			await client.call("Stop");
			server.kill();
		},
		async configure(config) {
			const prepared = await client.call("PrepareProviderConfig", { config: encodeDynamicValue(formatInputState(provider, config)) });
			await client.call("Configure", { config: prepared.preparedConfig });
		},
		async readResource(type, state) {
			const schema$1 = getResourceSchema(resources, type);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ReadResource", {
				typeName: type,
				currentState: encodeDynamicValue(formatInputState(schema$1, state))
			})).newState));
		},
		async readDataSource(type, state) {
			const schema$1 = getResourceSchema(dataSources, type);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ReadDataSource", {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema$1, state))
			})).state));
		},
		async validateResource(type, state) {
			const schema$1 = getResourceSchema(resources, type);
			await client.call("ValidateResourceTypeConfig", {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema$1, state))
			});
		},
		async planResourceChange(type, priorState, proposedState, configState) {
			const schema$1 = getResourceSchema(resources, type);
			const preparedPriorState = formatInputState(schema$1, priorState);
			const preparedProposedState = formatInputState(schema$1, proposedState);
			const preparedConfigState = formatInputState(schema$1, configState);
			const plan = await client.call("PlanResourceChange", {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				proposedNewState: encodeDynamicValue(preparedProposedState),
				config: encodeDynamicValue(preparedConfigState)
			});
			const plannedState = formatOutputState(schema$1, decodeDynamicValue(plan.plannedState));
			return {
				requiresReplace: filterRequiresReplace(formatAttributePath(plan.requiresReplace), preparedPriorState, preparedProposedState),
				plannedState
			};
		},
		async applyResourceChange(type, priorState, plannedState, configState) {
			const schema$1 = getResourceSchema(resources, type);
			const preparedPriorState = formatInputState(schema$1, priorState);
			const preparedPlannedState = formatInputState(schema$1, plannedState);
			const preparedConfigState = formatInputState(schema$1, configState);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ApplyResourceChange", {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				plannedState: encodeDynamicValue(preparedPlannedState),
				config: encodeDynamicValue(preparedConfigState)
			})).newState));
		}
	};
};

//#endregion
//#region src/plugin/version/6.ts
const createPlugin6 = async ({ server, client }) => {
	const schema = await client.call("GetProviderSchema");
	const provider = parseProviderSchema(schema.provider);
	const resources = parseResourceSchema(schema.resourceSchemas);
	const dataSources = parseResourceSchema(schema.dataSourceSchemas);
	return {
		schema() {
			return {
				provider,
				resources,
				dataSources
			};
		},
		async stop() {
			await client.call("StopProvider");
			server.kill();
		},
		async configure(config) {
			const prepared = await client.call("ValidateProviderConfig", { config: encodeDynamicValue(formatInputState(provider, config)) });
			await client.call("ConfigureProvider", { config: prepared.preparedConfig });
		},
		async readResource(type, state) {
			const schema$1 = getResourceSchema(resources, type);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ReadResource", {
				typeName: type,
				currentState: encodeDynamicValue(formatInputState(schema$1, state))
			})).newState));
		},
		async readDataSource(type, state) {
			const schema$1 = getResourceSchema(dataSources, type);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ReadDataSource", {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema$1, state))
			})).state));
		},
		async validateResource(type, state) {
			const schema$1 = getResourceSchema(resources, type);
			await client.call("ValidateResourceConfig", {
				typeName: type,
				config: encodeDynamicValue(formatInputState(schema$1, state))
			});
		},
		async planResourceChange(type, priorState, proposedState) {
			const schema$1 = getResourceSchema(resources, type);
			const preparedPriorState = formatInputState(schema$1, priorState);
			const preparedProposedState = formatInputState(schema$1, proposedState);
			const configState = formatInputState(schema$1, proposedState);
			const plan = await client.call("PlanResourceChange", {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				proposedNewState: encodeDynamicValue(preparedProposedState),
				config: encodeDynamicValue(configState)
			});
			const plannedState = formatOutputState(schema$1, decodeDynamicValue(plan.plannedState));
			return {
				requiresReplace: filterRequiresReplace(formatAttributePath(plan.requiresReplace), preparedPriorState, preparedProposedState),
				plannedState
			};
		},
		async applyResourceChange(type, priorState, plannedState, configState) {
			const schema$1 = getResourceSchema(resources, type);
			const preparedPriorState = formatInputState(schema$1, priorState);
			const preparedPlannedState = formatInputState(schema$1, plannedState);
			const preparedConfigState = formatInputState(schema$1, configState);
			return formatOutputState(schema$1, decodeDynamicValue((await client.call("ApplyResourceChange", {
				typeName: type,
				priorState: encodeDynamicValue(preparedPriorState),
				plannedState: encodeDynamicValue(preparedPlannedState),
				config: encodeDynamicValue(preparedConfigState)
			})).newState));
		}
	};
};

//#endregion
//#region src/lazy-plugin.ts
const createLazyPlugin = (props) => {
	return async () => {
		const { file } = await downloadPlugin(props);
		const server = await retry(3, () => createPluginServer({
			file,
			debug: false
		}));
		const client = await retry(3, () => createPluginClient(server));
		const plugin = await {
			5: () => createPlugin5({
				server,
				client
			}),
			6: () => createPlugin6({
				server,
				client
			})
		}[server.version]?.();
		if (!plugin) throw new Error(`No plugin client available for protocol version ${server.version}`);
		return plugin;
	};
};
const retry = async (tries, cb) => {
	let latestError;
	while (--tries) try {
		return await cb();
	} catch (error) {
		latestError = error;
	}
	throw latestError;
};

//#endregion
//#region src/proxy.ts
const classMap = /* @__PURE__ */ new Map();
const getClass = (type) => {
	if (!classMap.has(type)) classMap.set(type, class {});
	return classMap.get(type);
};
const createResourceProxy = (klass, cb) => {
	return new Proxy({}, {
		get(_, key) {
			return cb(key);
		},
		set(_, key) {
			if (typeof key === "string") throw new Error(`Cannot set property ${key} on read-only object.`);
			throw new Error(`This object is read-only.`);
		},
		getPrototypeOf() {
			return klass.prototype;
		}
	});
};
const createNamespaceProxy = (cb) => {
	const cache = /* @__PURE__ */ new Map();
	return new Proxy({}, {
		get(_, key) {
			if (typeof key === "string") {
				if (!cache.has(key)) {
					const value = cb(key);
					cache.set(key, value);
				}
				return cache.get(key);
			}
		},
		set(_, key) {
			if (typeof key === "string") throw new Error(`Cannot set property ${key} on read-only object.`);
			throw new Error(`This object is read-only.`);
		}
	});
};
const createRootProxy = (apply, get) => {
	const cache = /* @__PURE__ */ new Map();
	return new Proxy(() => {}, {
		apply(_, _this, args) {
			return apply(...args);
		},
		get(_, key) {
			if (typeof key === "string") {
				if (!cache.has(key)) {
					const value = get(key);
					cache.set(key, value);
				}
				return cache.get(key);
			}
		}
	});
};
const createClassProxy = (name, target, construct, get) => {
	return new Proxy(target, {
		construct(_, args) {
			return construct(...args);
		},
		get(_, key) {
			if (key === "prototype") return target.prototype;
			if (key === "name") return name;
			if (key === "get") return (...args) => {
				return get(...args);
			};
		}
	});
};
const createRecursiveProxy = ({ provider, install, uninstall, isInstalled, class: klass, resource, dataSource }) => {
	const findNextProxy = (ns, name) => {
		if (name === name.toLowerCase()) return createNamespaceProxy((key) => {
			return findNextProxy([...ns, name], key);
		});
		else if (name.startsWith("get")) return (...args) => {
			return dataSource([...ns, name.substring(3)], ...args);
		};
		else return createClassProxy(pascalCase([...ns, name].join("-")), klass([...ns, name]), (...args) => {
			return resource([...ns, name], ...args);
		}, (...args) => {
			return dataSource([...ns, name], ...args);
		});
	};
	return createRootProxy(provider, (key) => {
		if (key === "install") return install;
		if (key === "uninstall") return uninstall;
		if (key === "isInstalled") return isInstalled;
		return findNextProxy([], key);
	});
};
const createTerraformProxy = (props) => {
	return createRecursiveProxy({
		provider(input, config) {
			return new TerraformProvider(props.namespace, config?.id ?? "default", createLazyPlugin({
				...props.provider,
				location: config?.location
			}), input);
		},
		async install(installProps) {
			await downloadPlugin({
				...props.provider,
				...installProps
			});
		},
		async uninstall(installProps) {
			await deletePlugin({
				...props.provider,
				...installProps
			});
		},
		isInstalled(installProps) {
			return isPluginInstalled({
				...props.provider,
				...installProps
			});
		},
		class: (ns) => {
			return getClass(snakeCase([props.namespace, ...ns].join("_")));
		},
		resource: (ns, parent, id, input, config) => {
			const type = snakeCase([props.namespace, ...ns].join("_"));
			const meta = createMeta("resource", `terraform:${props.namespace}:${config?.provider ?? "default"}`, parent, type, id, input, config);
			const resource = createResourceProxy(getClass(type), (key) => {
				if (typeof key === "string") {
					if (key === "urn") return meta.urn;
					return meta.output((data) => data[key]);
				} else if (key === nodeMetaSymbol) return meta;
			});
			parent.add(resource);
			return resource;
		},
		dataSource: (ns, parent, id, input, config) => {
			const type = snakeCase([props.namespace, ...ns].join("_"));
			const meta = createMeta("data", `terraform:${props.namespace}:${config?.provider ?? "default"}`, parent, type, id, input, config);
			const dataSource = createResourceProxy(getClass(type), (key) => {
				if (typeof key === "string") {
					if (key === "urn") return meta.urn;
					return meta.output((data) => data[key]);
				} else if (key === nodeMetaSymbol) return meta;
			});
			parent.add(dataSource);
			return dataSource;
		}
	});
};

//#endregion
export { TerraformProvider, createTerraformProxy, generateTypes };
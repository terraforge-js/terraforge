// src/type-gen.ts
import { camelCase, pascalCase } from "change-case";
var tab = (indent) => {
  return "	".repeat(indent);
};
var generateTypes = (providers, resources, dataSources) => {
  return [
    generateImport("c", "@terraforge/core"),
    generateImport("t", "@terraforge/terraform"),
    "type _Record<T> = Record<string, T>",
    generateInstallHelperFunctions(providers),
    generateNamespace(providers, (name, prop, indent) => {
      const typeName = name.toLowerCase();
      return `${tab(indent)}export declare function ${typeName}(props: ${generatePropertyInputConst(prop, indent)}, config?: t.TerraformProviderConfig): t.TerraformProvider`;
    }),
    generateNamespace(resources, (name, prop, indent) => {
      const typeName = pascalCase(name);
      return [
        // `${tab(indent)}export type ${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
        // `${tab(indent)}export type ${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
        // `${tab(indent)}export declare const ${typeName}: ResourceClass<${typeName}Input, ${typeName}Output>`,
        `${tab(indent)}export type ${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
        `${tab(indent)}export type ${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
        `${tab(indent)}export class ${typeName} {`,
        `${tab(indent + 1)}constructor(parent: c.Group, id: string, props: ${typeName}Input, config?:c.ResourceConfig)`,
        // `${tab(indent + 1)}readonly $: c.ResourceMeta<${typeName}Input, ${typeName}Output>`,
        generateClassProperties(prop, indent + 1),
        `${tab(indent)}}`
      ].join("\n\n");
    }),
    generateNamespace(dataSources, (name, prop, indent) => {
      const typeName = pascalCase(name);
      return [
        `${tab(indent)}export type Get${typeName}Input = ${generatePropertyInputType(prop, indent)}`,
        `${tab(indent)}export type Get${typeName}Output = ${generatePropertyOutputType(prop, indent)}`,
        `${tab(indent)}export const get${typeName}:c.DataSourceFunction<Get${typeName}Input, Get${typeName}Output>`
      ].join("\n\n");
    })
  ].join("\n\n");
};
var generateImport = (name, from) => {
  return `import * as ${name} from '${from}'`;
};
var generateInstallHelperFunctions = (resources) => {
  return generateNamespace(resources, (name, _prop, indent) => {
    const typeName = name.toLowerCase();
    return [
      `${tab(indent)}export declare namespace ${typeName} {`,
      `${tab(indent + 1)}export function install(props?: t.InstallProps): Promise<void>`,
      `${tab(indent + 1)}export function uninstall(props?: t.InstallProps): Promise<void>`,
      `${tab(indent + 1)}export function isInstalled(props?: t.InstallProps): Promise<boolean>`,
      `${tab(indent)}}`
    ].join("\n");
  });
};
var generatePropertyInputConst = (prop, indent) => {
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
var generatePropertyInputType = (prop, indent) => {
  return generateValue(prop, {
    depth: 0,
    indent: indent + 1,
    wrap: (v, p, ctx) => {
      return ctx.depth > 0 ? p.optional ? `c.OptionalInput<${v}>` : `c.Input<${v}>` : v;
    },
    filter: (prop2) => !(prop2.computed && typeof prop2.optional === "undefined" && typeof prop2.required === "undefined"),
    optional: (p) => p.optional ?? false
  });
};
var generatePropertyOutputType = (prop, indent) => {
  return generateValue(prop, {
    depth: 0,
    indent: indent + 1,
    wrap: (v, p, ctx) => ctx.depth === 1 ? p.optional && !p.computed ? `c.OptionalOutput<${v}>` : `c.Output<${v}>` : v,
    filter: () => true,
    readonly: true,
    // required: true,
    optional: (p, ctx) => ctx.depth > 1 && p.optional && !p.computed || false
  });
};
var generateClassProperties = (prop, indent) => {
  if (prop.type !== "object") {
    return "";
  }
  return Object.entries(prop.properties).map(([name, prop2]) => {
    return [
      prop2.description ? [`
`, `	`.repeat(indent), `/** `, prop2.description.trim(), " */", "\n"].join("") : "",
      `	`.repeat(indent),
      "readonly ",
      camelCase(name),
      // ctx.optional(prop, ctx) ? '?' : '',
      ": ",
      generateValue(prop2, {
        readonly: true,
        filter: () => true,
        optional: (p, ctx) => ctx.depth > 1 && p.optional && !p.computed || false,
        wrap: (v, p, ctx) => {
          return ctx.depth === 1 ? p.optional && !p.computed ? `c.OptionalOutput<${v}>` : `c.Output<${v}>` : v;
        },
        // ctx.depth === 1 ? `c.Output<${p.optional && !p.computed ? `${v} | undefined` : v}>` : v,
        indent: indent + 1,
        depth: 1
      })
    ].join("");
  }).join("\n");
};
var groupByNamespace = (resources, minLevel, maxLevel) => {
  const grouped = {};
  const types = Object.keys(resources).sort();
  for (const type of types) {
    const names = type.split("_");
    if (names.length < minLevel) {
      throw new Error(`Resource not properly namespaced: ${type}`);
    }
    let current = grouped;
    let count = Math.min(maxLevel, names.length - 1);
    while (count--) {
      const ns = camelCase(names.shift());
      if (!current[ns]) {
        current[ns] = {};
      }
      current = current[ns];
    }
    const name = pascalCase(names.join("_"));
    current[name] = type;
  }
  return grouped;
};
var generateNamespace = (resources, render) => {
  const grouped = groupByNamespace(resources, 1, 2);
  const renderNamespace = (name, group, indent) => {
    if (name === "default") {
      name = "$default";
    }
    if (typeof group === "string") {
      return render(name, resources[group], indent);
    }
    return [
      `${tab(indent)}export ${indent === 0 ? "declare " : ""}namespace ${name.toLowerCase()} {`,
      Object.entries(group).map(([name2, entry]) => {
        if (typeof entry !== "string") {
          return renderNamespace(name2, entry, indent + 1);
        } else {
          return render(name2, resources[entry], indent + 1);
        }
      }).join("\n"),
      `${tab(indent)}}`
    ].join("\n");
  };
  return Object.entries(grouped).map(([name, entry]) => {
    return renderNamespace(name, entry, 0);
  });
};
var generateValue = (prop, ctx) => {
  if (["string", "number", "boolean", "unknown"].includes(prop.type)) {
    return ctx.wrap(prop.type, prop, ctx);
  }
  if (prop.type === "array") {
    const type = generateValue(prop.item, { ...ctx, depth: ctx.depth + 1 });
    const array = ctx.readonly ? `ReadonlyArray<${type}>` : `Array<${type}>`;
    return ctx.wrap(array, prop, ctx);
  }
  if (prop.type === "record") {
    const type = generateValue(prop.item, { ...ctx, depth: ctx.depth + 1 });
    const record = ctx.readonly ? `Readonly<_Record<${type}>>` : `_Record<${type}>`;
    return ctx.wrap(record, prop, ctx);
  }
  if (prop.type === "object" || prop.type === "array-object") {
    const type = [
      "{",
      Object.entries(prop.properties).filter(([_, p]) => ctx.filter(p)).map(
        ([name, prop2]) => [
          prop2.description ? [`
`, `	`.repeat(ctx.indent), `/** `, prop2.description.trim(), " */", "\n"].join("") : "",
          `	`.repeat(ctx.indent),
          // ctx.readonly ? "readonly " : "",
          camelCase(name),
          ctx.optional(prop2, ctx) ? "?" : "",
          ": ",
          generateValue(prop2, { ...ctx, indent: ctx.indent + 1, depth: ctx.depth + 1 })
        ].join("")
      ).join("\n"),
      `${`	`.repeat(ctx.indent - 1)}}`
    ].join("\n");
    const object = ctx.readonly ? `Readonly<${type}>` : type;
    return ctx.wrap(object, prop, ctx);
  }
  throw new Error(`Unknown property type: ${prop.type}`);
};

// src/provider.ts
import {
  ResourceNotFound
} from "@terraforge/core";
var TerraformProvider = class {
  constructor(type, id, createPlugin, config) {
    this.type = type;
    this.id = id;
    this.createPlugin = createPlugin;
    this.config = config;
  }
  configured;
  plugin;
  async configure() {
    const plugin = await this.prepare();
    if (!this.configured) {
      this.configured = plugin.configure(this.config);
    }
    await this.configured;
    return plugin;
  }
  prepare() {
    if (!this.plugin) {
      this.plugin = this.createPlugin();
    }
    return this.plugin;
  }
  async destroy() {
    if (this.plugin) {
      const plugin = await this.plugin;
      plugin.stop();
      this.plugin = void 0;
      this.configured = void 0;
    }
  }
  ownResource(id) {
    return `terraform:${this.type}:${this.id}` === id;
  }
  async getResource({ type, state }) {
    const plugin = await this.configure();
    const newState = await plugin.readResource(type, state);
    if (!newState) {
      throw new ResourceNotFound();
    }
    return {
      version: 0,
      state: newState
    };
  }
  async createResource({ type, state }) {
    const plugin = await this.configure();
    const newState = await plugin.applyResourceChange(type, null, state);
    return {
      version: 0,
      state: newState
    };
  }
  async updateResource({ type, priorState, proposedState }) {
    const plugin = await this.configure();
    const { requiresReplace } = await plugin.planResourceChange(type, priorState, proposedState);
    if (requiresReplace.length > 0) {
      const formattedAttrs = requiresReplace.map((p) => p.join(".")).join('", "');
      throw new Error(
        `Updating the "${formattedAttrs}" properties for the "${type}" resource will require the resource to be replaced.`
      );
    }
    const newState = await plugin.applyResourceChange(type, priorState, proposedState);
    return {
      version: 0,
      state: newState
    };
  }
  async deleteResource({ type, state }) {
    const plugin = await this.configure();
    try {
      await plugin.applyResourceChange(type, state, null);
    } catch (error) {
      try {
        const newState = await plugin.readResource(type, state);
        if (!newState) {
          throw new ResourceNotFound();
        }
      } catch (_) {
      }
      throw error;
    }
  }
  async getData({ type, state }) {
    const plugin = await this.configure();
    const data = await plugin.readDataSource(type, state);
    if (!data) {
      throw new Error(`Data source not found ${type}`);
    }
    return {
      state: data
    };
  }
  // async generateTypes(dir: string) {
  // 	const plugin = await this.prepare()
  // 	const schema = plugin.schema()
  // 	const types = generateTypes(
  // 		{
  // 			[`${this.type}_provider`]: schema.provider,
  // 		},
  // 		schema.resources,
  // 		schema.dataSources
  // 	)
  // 	await mkdir(dir, { recursive: true })
  // 	await writeFile(join(dir, `${this.type}.d.ts`), types)
  // 	await this.destroy()
  // }
};

// src/proxy.ts
import { createMeta, nodeMetaSymbol } from "@terraforge/core";
import { snakeCase as snakeCase2 } from "change-case";

// src/plugin/client.ts
import { credentials, loadPackageDefinition } from "@grpc/grpc-js";
import { fromJSON } from "@grpc/proto-loader";
import { createDebugger } from "@terraforge/core";

// src/plugin/diagnostic.ts
var DiagnosticsError = class extends Error {
  diagnostics;
  constructor(diagnostics) {
    super(diagnostics[0]?.summary ?? "Diagnostic error");
    this.diagnostics = diagnostics;
  }
};
var throwDiagnosticError = (response) => {
  const diagnostics = response.diagnostics.map((item) => ({
    severity: item.severity === 1 ? "error" : "warning",
    summary: item.summary,
    detail: item.detail,
    path: item.attribute?.steps.map((step) => step.attributeName)
  }));
  return new DiagnosticsError(diagnostics);
};

// src/plugin/protocol/tfplugin5.ts
var tfplugin5_default = {
  options: { syntax: "proto3" },
  nested: {
    tfplugin5: {
      nested: {
        DynamicValue: { fields: { msgpack: { type: "bytes", id: 1 }, json: { type: "bytes", id: 2 } } },
        Diagnostic: {
          fields: {
            severity: { type: "Severity", id: 1 },
            summary: { type: "string", id: 2 },
            detail: { type: "string", id: 3 },
            attribute: { type: "AttributePath", id: 4 }
          },
          nested: { Severity: { values: { INVALID: 0, ERROR: 1, WARNING: 2 } } }
        },
        AttributePath: {
          fields: { steps: { rule: "repeated", type: "Step", id: 1 } },
          nested: {
            Step: {
              oneofs: { selector: { oneof: ["attributeName", "elementKeyString", "elementKeyInt"] } },
              fields: {
                attributeName: { type: "string", id: 1 },
                elementKeyString: { type: "string", id: 2 },
                elementKeyInt: { type: "int64", id: 3 }
              }
            }
          }
        },
        Stop: {
          fields: {},
          nested: { Request: { fields: {} }, Response: { fields: { Error: { type: "string", id: 1 } } } }
        },
        RawState: {
          fields: { json: { type: "bytes", id: 1 }, flatmap: { keyType: "string", type: "string", id: 2 } }
        },
        Schema: {
          fields: { version: { type: "int64", id: 1 }, block: { type: "Block", id: 2 } },
          nested: {
            Block: {
              fields: {
                version: { type: "int64", id: 1 },
                attributes: { rule: "repeated", type: "Attribute", id: 2 },
                blockTypes: { rule: "repeated", type: "NestedBlock", id: 3 }
              }
            },
            Attribute: {
              fields: {
                name: { type: "string", id: 1 },
                type: { type: "bytes", id: 2 },
                description: { type: "string", id: 3 },
                required: { type: "bool", id: 4 },
                optional: { type: "bool", id: 5 },
                computed: { type: "bool", id: 6 },
                sensitive: { type: "bool", id: 7 }
              }
            },
            NestedBlock: {
              fields: {
                typeName: { type: "string", id: 1 },
                block: { type: "Block", id: 2 },
                nesting: { type: "NestingMode", id: 3 },
                minItems: { type: "int64", id: 4 },
                maxItems: { type: "int64", id: 5 }
              },
              nested: {
                NestingMode: { values: { INVALID: 0, SINGLE: 1, LIST: 2, SET: 3, MAP: 4, GROUP: 5 } }
              }
            }
          }
        },
        Provider: {
          methods: {
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
            Configure: { requestType: "Configure.Request", responseType: "Configure.Response" },
            ReadResource: { requestType: "ReadResource.Request", responseType: "ReadResource.Response" },
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
            Stop: { requestType: "Stop.Request", responseType: "Stop.Response" }
          }
        },
        GetProviderSchema: {
          fields: {},
          nested: {
            Request: { fields: {} },
            Response: {
              fields: {
                provider: { type: "Schema", id: 1 },
                resourceSchemas: { keyType: "string", type: "Schema", id: 2 },
                dataSourceSchemas: { keyType: "string", type: "Schema", id: 3 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 4 }
              }
            }
          }
        },
        PrepareProviderConfig: {
          fields: {},
          nested: {
            Request: { fields: { config: { type: "DynamicValue", id: 1 } } },
            Response: {
              fields: {
                preparedConfig: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        UpgradeResourceState: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                version: { type: "int64", id: 2 },
                rawState: { type: "RawState", id: 3 }
              }
            },
            Response: {
              fields: {
                upgradedState: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        ValidateResourceTypeConfig: {
          fields: {},
          nested: {
            Request: {
              fields: { typeName: { type: "string", id: 1 }, config: { type: "DynamicValue", id: 2 } }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ValidateDataSourceConfig: {
          fields: {},
          nested: {
            Request: {
              fields: { typeName: { type: "string", id: 1 }, config: { type: "DynamicValue", id: 2 } }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        Configure: {
          fields: {},
          nested: {
            Request: {
              fields: {
                terraformVersion: { type: "string", id: 1 },
                config: { type: "DynamicValue", id: 2 }
              }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ReadResource: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                currentState: { type: "DynamicValue", id: 2 },
                private: { type: "bytes", id: 3 }
              }
            },
            Response: {
              fields: {
                newState: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 },
                private: { type: "bytes", id: 3 }
              }
            }
          }
        },
        PlanResourceChange: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                priorState: { type: "DynamicValue", id: 2 },
                proposedNewState: { type: "DynamicValue", id: 3 },
                config: { type: "DynamicValue", id: 4 },
                priorPrivate: { type: "bytes", id: 5 }
              }
            },
            Response: {
              fields: {
                plannedState: { type: "DynamicValue", id: 1 },
                requiresReplace: { rule: "repeated", type: "AttributePath", id: 2 },
                plannedPrivate: { type: "bytes", id: 3 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 4 },
                legacyTypeSystem: { type: "bool", id: 5 }
              }
            }
          }
        },
        ApplyResourceChange: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                priorState: { type: "DynamicValue", id: 2 },
                plannedState: { type: "DynamicValue", id: 3 },
                config: { type: "DynamicValue", id: 4 },
                plannedPrivate: { type: "bytes", id: 5 }
              }
            },
            Response: {
              fields: {
                newState: { type: "DynamicValue", id: 1 },
                private: { type: "bytes", id: 2 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 3 },
                legacyTypeSystem: { type: "bool", id: 4 }
              }
            }
          }
        },
        ImportResourceState: {
          fields: {},
          nested: {
            Request: { fields: { typeName: { type: "string", id: 1 }, id: { type: "string", id: 2 } } },
            ImportedResource: {
              fields: {
                typeName: { type: "string", id: 1 },
                state: { type: "DynamicValue", id: 2 },
                private: { type: "bytes", id: 3 }
              }
            },
            Response: {
              fields: {
                importedResources: { rule: "repeated", type: "ImportedResource", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        ReadDataSource: {
          fields: {},
          nested: {
            Request: {
              fields: { typeName: { type: "string", id: 1 }, config: { type: "DynamicValue", id: 2 } }
            },
            Response: {
              fields: {
                state: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        Provisioner: {
          methods: {
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
            Stop: { requestType: "Stop.Request", responseType: "Stop.Response" }
          }
        },
        GetProvisionerSchema: {
          fields: {},
          nested: {
            Request: { fields: {} },
            Response: {
              fields: {
                provisioner: { type: "Schema", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        ValidateProvisionerConfig: {
          fields: {},
          nested: {
            Request: { fields: { config: { type: "DynamicValue", id: 1 } } },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ProvisionResource: {
          fields: {},
          nested: {
            Request: {
              fields: {
                config: { type: "DynamicValue", id: 1 },
                connection: { type: "DynamicValue", id: 2 }
              }
            },
            Response: {
              fields: {
                output: { type: "string", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        }
      }
    }
  }
};

// src/plugin/protocol/tfplugin6.ts
var tfplugin6_default = {
  options: { syntax: "proto3", go_package: "github.com/hashicorp/terraform/internal/tfplugin6" },
  nested: {
    tfplugin6: {
      nested: {
        DynamicValue: { fields: { msgpack: { type: "bytes", id: 1 }, json: { type: "bytes", id: 2 } } },
        Diagnostic: {
          fields: {
            severity: { type: "Severity", id: 1 },
            summary: { type: "string", id: 2 },
            detail: { type: "string", id: 3 },
            attribute: { type: "AttributePath", id: 4 }
          },
          nested: { Severity: { values: { INVALID: 0, ERROR: 1, WARNING: 2 } } }
        },
        AttributePath: {
          fields: { steps: { rule: "repeated", type: "Step", id: 1 } },
          nested: {
            Step: {
              oneofs: { selector: { oneof: ["attributeName", "elementKeyString", "elementKeyInt"] } },
              fields: {
                attributeName: { type: "string", id: 1 },
                elementKeyString: { type: "string", id: 2 },
                elementKeyInt: { type: "int64", id: 3 }
              }
            }
          }
        },
        StopProvider: {
          fields: {},
          nested: { Request: { fields: {} }, Response: { fields: { Error: { type: "string", id: 1 } } } }
        },
        RawState: {
          fields: { json: { type: "bytes", id: 1 }, flatmap: { keyType: "string", type: "string", id: 2 } }
        },
        StringKind: { values: { PLAIN: 0, MARKDOWN: 1 } },
        Schema: {
          fields: { version: { type: "int64", id: 1 }, block: { type: "Block", id: 2 } },
          nested: {
            Block: {
              fields: {
                version: { type: "int64", id: 1 },
                attributes: { rule: "repeated", type: "Attribute", id: 2 },
                blockTypes: { rule: "repeated", type: "NestedBlock", id: 3 },
                description: { type: "string", id: 4 },
                descriptionKind: { type: "StringKind", id: 5 },
                deprecated: { type: "bool", id: 6 }
              }
            },
            Attribute: {
              fields: {
                name: { type: "string", id: 1 },
                type: { type: "bytes", id: 2 },
                nestedType: { type: "Object", id: 10 },
                description: { type: "string", id: 3 },
                required: { type: "bool", id: 4 },
                optional: { type: "bool", id: 5 },
                computed: { type: "bool", id: 6 },
                sensitive: { type: "bool", id: 7 },
                descriptionKind: { type: "StringKind", id: 8 },
                deprecated: { type: "bool", id: 9 }
              }
            },
            NestedBlock: {
              fields: {
                typeName: { type: "string", id: 1 },
                block: { type: "Block", id: 2 },
                nesting: { type: "NestingMode", id: 3 },
                minItems: { type: "int64", id: 4 },
                maxItems: { type: "int64", id: 5 }
              },
              nested: {
                NestingMode: { values: { INVALID: 0, SINGLE: 1, LIST: 2, SET: 3, MAP: 4, GROUP: 5 } }
              }
            },
            Object: {
              fields: {
                attributes: { rule: "repeated", type: "Attribute", id: 1 },
                nesting: { type: "NestingMode", id: 3 },
                minItems: { type: "int64", id: 4 },
                maxItems: { type: "int64", id: 5 }
              },
              nested: { NestingMode: { values: { INVALID: 0, SINGLE: 1, LIST: 2, SET: 3, MAP: 4 } } }
            }
          }
        },
        Provider: {
          methods: {
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
            ReadResource: { requestType: "ReadResource.Request", responseType: "ReadResource.Response" },
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
            StopProvider: { requestType: "StopProvider.Request", responseType: "StopProvider.Response" }
          }
        },
        GetProviderSchema: {
          fields: {},
          nested: {
            Request: { fields: {} },
            Response: {
              fields: {
                provider: { type: "Schema", id: 1 },
                resourceSchemas: { keyType: "string", type: "Schema", id: 2 },
                dataSourceSchemas: { keyType: "string", type: "Schema", id: 3 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 4 },
                providerMeta: { type: "Schema", id: 5 }
              }
            }
          }
        },
        ValidateProviderConfig: {
          fields: {},
          nested: {
            Request: { fields: { config: { type: "DynamicValue", id: 1 } } },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 } } }
          }
        },
        UpgradeResourceState: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                version: { type: "int64", id: 2 },
                rawState: { type: "RawState", id: 3 }
              }
            },
            Response: {
              fields: {
                upgradedState: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        ValidateResourceConfig: {
          fields: {},
          nested: {
            Request: {
              fields: { typeName: { type: "string", id: 1 }, config: { type: "DynamicValue", id: 2 } }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ValidateDataResourceConfig: {
          fields: {},
          nested: {
            Request: {
              fields: { typeName: { type: "string", id: 1 }, config: { type: "DynamicValue", id: 2 } }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ConfigureProvider: {
          fields: {},
          nested: {
            Request: {
              fields: {
                terraformVersion: { type: "string", id: 1 },
                config: { type: "DynamicValue", id: 2 }
              }
            },
            Response: { fields: { diagnostics: { rule: "repeated", type: "Diagnostic", id: 1 } } }
          }
        },
        ReadResource: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                currentState: { type: "DynamicValue", id: 2 },
                private: { type: "bytes", id: 3 },
                providerMeta: { type: "DynamicValue", id: 4 }
              }
            },
            Response: {
              fields: {
                newState: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 },
                private: { type: "bytes", id: 3 }
              }
            }
          }
        },
        PlanResourceChange: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                priorState: { type: "DynamicValue", id: 2 },
                proposedNewState: { type: "DynamicValue", id: 3 },
                config: { type: "DynamicValue", id: 4 },
                priorPrivate: { type: "bytes", id: 5 },
                providerMeta: { type: "DynamicValue", id: 6 }
              }
            },
            Response: {
              fields: {
                plannedState: { type: "DynamicValue", id: 1 },
                requiresReplace: { rule: "repeated", type: "AttributePath", id: 2 },
                plannedPrivate: { type: "bytes", id: 3 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 4 }
              }
            }
          }
        },
        ApplyResourceChange: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                priorState: { type: "DynamicValue", id: 2 },
                plannedState: { type: "DynamicValue", id: 3 },
                config: { type: "DynamicValue", id: 4 },
                plannedPrivate: { type: "bytes", id: 5 },
                providerMeta: { type: "DynamicValue", id: 6 }
              }
            },
            Response: {
              fields: {
                newState: { type: "DynamicValue", id: 1 },
                private: { type: "bytes", id: 2 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 3 }
              }
            }
          }
        },
        ImportResourceState: {
          fields: {},
          nested: {
            Request: { fields: { typeName: { type: "string", id: 1 }, id: { type: "string", id: 2 } } },
            ImportedResource: {
              fields: {
                typeName: { type: "string", id: 1 },
                state: { type: "DynamicValue", id: 2 },
                private: { type: "bytes", id: 3 }
              }
            },
            Response: {
              fields: {
                importedResources: { rule: "repeated", type: "ImportedResource", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        },
        ReadDataSource: {
          fields: {},
          nested: {
            Request: {
              fields: {
                typeName: { type: "string", id: 1 },
                config: { type: "DynamicValue", id: 2 },
                providerMeta: { type: "DynamicValue", id: 3 }
              }
            },
            Response: {
              fields: {
                state: { type: "DynamicValue", id: 1 },
                diagnostics: { rule: "repeated", type: "Diagnostic", id: 2 }
              }
            }
          }
        }
      }
    }
  }
};

// src/plugin/client.ts
var debug = createDebugger("Client");
var protocols = {
  tfplugin5: tfplugin5_default,
  tfplugin6: tfplugin6_default
};
var createPluginClient = async (props) => {
  const proto = protocols[props.protocol.split(".").at(0) ?? ""];
  if (!proto) {
    throw new Error(`We don't have support for the ${props.protocol} protocol`);
  }
  const pack2 = fromJSON(proto);
  const grpc = loadPackageDefinition(pack2);
  const client = new grpc["tfplugin" + props.version].Provider(
    `unix://${props.endpoint}`,
    credentials.createInsecure(),
    {
      "grpc.max_receive_message_length": 100 * 1024 * 1024,
      "grpc.max_send_message_length": 100 * 1024 * 1024
    }
  );
  debug("init", props.protocol);
  await new Promise((resolve, reject) => {
    const deadline = /* @__PURE__ */ new Date();
    deadline.setSeconds(deadline.getSeconds() + 10);
    client.waitForReady(deadline, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
  debug("connected");
  return {
    call(method, payload) {
      return new Promise((resolve, reject) => {
        const fn = client[method];
        debug("call", method);
        if (!fn) {
          reject(new Error(`Unknown method call: ${method}`));
          return;
        }
        fn.call(client, payload, (error, response) => {
          if (error) {
            debug("failed", error);
            reject(error);
          } else if (response.diagnostics) {
            debug("failed", response.diagnostics);
            reject(throwDiagnosticError(response));
          } else {
            resolve(response);
          }
        });
      });
    }
  };
};

// src/plugin/download.ts
import { createDebugger as createDebugger2 } from "@terraforge/core";
import jszip from "jszip";
import { mkdir, rm, stat, writeFile } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";

// src/plugin/registry.ts
import { arch, platform } from "os";
import { compare } from "semver";
var baseUrl = "https://registry.terraform.io/v1/providers";
var getProviderVersions = async (org, type) => {
  const resp = await fetch(`${baseUrl}/${org}/${type}/versions`);
  const data = await resp.json();
  const versions = data.versions;
  const os = getOS();
  const ar = getArchitecture();
  const supported = versions.filter((v) => {
    return !!v.platforms.find((p) => p.os === os && p.arch === ar);
  });
  const sorted = supported.sort((a, b) => compare(a.version, b.version));
  const latest = sorted.at(-1);
  if (!latest) {
    throw new Error("Version is unsupported for your platform.");
  }
  return {
    versions,
    supported,
    latest: latest.version
  };
};
var getProviderDownloadUrl = async (org, type, version) => {
  const url = [
    //
    baseUrl,
    org,
    type,
    version,
    "download",
    getOS(),
    getArchitecture()
  ].join("/");
  const response = await fetch(url);
  const result = await response.json();
  return {
    url: result.download_url,
    shasum: result.shasum,
    protocols: result.protocols
  };
};
var getOS = () => {
  const os = platform();
  switch (os) {
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    case "darwin":
      return "darwin";
    case "freebsd":
      return "freebsd";
    case "openbsd":
      return "openbsd";
  }
  throw new Error(`Unsupported OS platform: ${os}`);
};
var getArchitecture = () => {
  const ar = arch();
  switch (ar) {
    case "arm":
      return "arm";
    case "arm64":
      return "arm64";
    case "x64":
      return "amd64";
    case "ia32":
      return "386";
  }
  throw new Error(`Unsupported architecture: ${ar}`);
};

// src/plugin/download.ts
var exists = async (file) => {
  try {
    await stat(file);
  } catch (error) {
    return false;
  }
  return true;
};
var debug2 = createDebugger2("Downloader");
var installPath = join(homedir(), ".terraforge", "plugins");
var getInstallPath = (props) => {
  const dir = props.location ?? installPath;
  const file = join(dir, `${props.org}-${props.type}-${props.version}`);
  return file;
};
var isPluginInstalled = (props) => {
  return exists(getInstallPath(props));
};
var deletePlugin = async (props) => {
  const file = getInstallPath(props);
  const isAlreadyInstalled = await isPluginInstalled(props);
  if (isAlreadyInstalled) {
    debug2(props.type, "deleting...");
    await rm(file);
    debug2(props.type, "deleted");
  } else {
    debug2(props.type, "not installed");
  }
};
var downloadPlugin = async (props) => {
  if (props.version === "latest") {
    const { latest } = await getProviderVersions(props.org, props.type);
    props.version = latest;
  }
  const file = getInstallPath(props);
  const isAlreadyInstalled = await isPluginInstalled(props);
  if (!isAlreadyInstalled) {
    debug2(props.type, "downloading...");
    const info = await getProviderDownloadUrl(props.org, props.type, props.version);
    const res = await fetch(info.url);
    const buf = await res.bytes();
    const zip = await jszip.loadAsync(buf);
    const zipped = zip.filter((file2) => file2.startsWith("terraform-provider")).at(0);
    if (!zipped) {
      throw new Error(`Can't find the provider inside the downloaded zip file.`);
    }
    const binary = await zipped.async("nodebuffer");
    debug2(props.type, "done");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, binary, {
      mode: 509
    });
  } else {
    debug2(props.type, "already downloaded");
  }
  return {
    file,
    version: props.version
  };
};

// src/plugin/server.ts
import { createDebugger as createDebugger3 } from "@terraforge/core";
import { spawn } from "child_process";
var debug3 = createDebugger3("Server");
var createPluginServer = (props) => {
  return new Promise((resolve, reject) => {
    debug3("init");
    const process = spawn(`${props.file}`, ["-debug"]);
    process.stderr.on("data", (data) => {
      if (props.debug) {
        const message = data.toString("utf8");
        console.log(message);
      }
    });
    process.stdout.once("data", (data) => {
      try {
        const message = data.toString("utf8");
        const matches = message.match(/TF_REATTACH_PROVIDERS\=\'(.*)\'/);
        if (matches && matches.length > 0) {
          const match = matches[0];
          const json = match.slice(23, -1);
          const data2 = JSON.parse(json);
          const entries = Object.values(data2);
          if (entries.length > 0) {
            const entry = entries[0];
            const version = entry.ProtocolVersion;
            const endpoint = entry.Addr.String;
            debug3("started", endpoint);
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
      } catch (error) {
      }
      debug3("failed");
      reject(new Error("Failed to start the plugin"));
    });
  });
};

// src/plugin/schema.ts
var NestingMode = {
  INVALID: 0,
  SINGLE: 1,
  LIST: 2,
  SET: 3,
  MAP: 4,
  GROUP: 5
};
var parseResourceSchema = (schemas) => {
  const props = {};
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.block) {
      const block = parseBlock(schema.block);
      props[name] = {
        ...block,
        version: block.version ?? schema.version
      };
    }
  }
  return props;
};
var parseProviderSchema = (schema) => {
  if (schema.block) {
    const block = parseBlock(schema.block);
    return {
      ...block,
      version: block.version ?? schema.version
    };
  }
  throw new Error("Invalid block");
};
var parseBlock = (block) => {
  const properties = {};
  for (const entry of block.attributes ?? []) {
    properties[entry.name] = parseAttribute(entry);
  }
  for (const entry of block.blockTypes ?? []) {
    properties[entry.typeName] = parseNestedBlock(entry);
  }
  if (block.deprecated) {
    console.warn("Deprecated block");
  }
  return {
    type: "object",
    version: block.version,
    description: block.description,
    // deprecated: block.deprecated,
    properties
  };
};
var parseNestedBlock = (block) => {
  const type = parseNestedBlockType(block);
  const item = parseBlock(block.block);
  const prop = {
    optional: true,
    required: false,
    computed: false
  };
  if (type === "array" || type === "record") {
    return {
      ...prop,
      type,
      item
    };
  }
  if (type === "array-object") {
    return {
      ...prop,
      ...item,
      type
    };
  }
  return {
    ...prop,
    ...item
  };
};
var parseNestedBlockType = (block) => {
  if (block.nesting === NestingMode.SET) {
    return "array";
  }
  if (block.nesting === NestingMode.LIST) {
    if (block.maxItems?.eq(1)) {
      return "array-object";
    }
    return "array";
  }
  if (block.nesting === NestingMode.MAP) {
    return "record";
  }
  if (block.nesting === NestingMode.GROUP) {
    return "object";
  }
  if (block.nesting === NestingMode.SINGLE) {
    return "object";
  }
  throw new Error(`Invalid nested block type ${block.nesting}`);
};
var parseAttribute = (attr) => {
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
  if (attr.nestedType) {
    return {
      ...prop,
      ...parseBlock(attr.nestedType)
      // properties: parseBlock(attr.nestedType).properties,
    };
  }
  throw new Error("Empty attr");
};
var parseAttributeType = (item) => {
  if (Array.isArray(item)) {
    const type2 = parseType(item[0]);
    if (type2 === "array" || type2 === "record" && item) {
      const record = item[1];
      return {
        type: type2,
        item: parseAttributeType(record)
      };
    }
    if (type2 === "object") {
      const object = item[1];
      const properties = {};
      for (const [name, prop] of Object.entries(object)) {
        properties[name] = parseAttributeType(prop);
      }
      return {
        type: type2,
        properties
      };
    }
    throw new Error("Invalid attribute type");
  }
  const type = parseType(item);
  if (isLeafType(type)) {
    return {
      type
    };
  }
  throw new Error(`Invalid attribute type`);
};
var isLeafType = (type) => {
  return ["string", "number", "boolean", "unknown"].includes(type);
};
var parseType = (type) => {
  if (type === "string") {
    return "string";
  }
  if (type === "number") {
    return "number";
  }
  if (type === "bool") {
    return "boolean";
  }
  if (["set", "list"].includes(type)) {
    return "array";
  }
  if (type === "object") {
    return "object";
  }
  if (type === "map") {
    return "record";
  }
  if (type === "dynamic") {
    return "unknown";
  }
  throw new Error(`Invalid type: ${type}`);
};

// src/plugin/version/util.ts
import { camelCase as camelCase2, snakeCase } from "change-case";
import { pack, unpack } from "msgpackr";
var encodeDynamicValue = (value) => {
  return {
    msgpack: pack(value),
    json: value
  };
};
var decodeDynamicValue = (value) => {
  return unpack(value.msgpack);
};
var getResourceSchema = (resources, type) => {
  const resource = resources[type];
  if (!resource) {
    throw new Error(`Unknown resource type: ${type}`);
  }
  return resource;
};
var formatAttributePath = (state) => {
  if (!state) {
    return [];
  }
  return state.map((item) => {
    if (!item.steps) {
      throw new Error("AttributePath should always have steps");
    }
    return item.steps.map((attr) => {
      if ("attributeName" in attr) {
        return attr.attributeName;
      }
      if ("elementKeyString" in attr) {
        return attr.elementKeyString;
      }
      if ("elementKeyInt" in attr) {
        return attr.elementKeyInt;
      }
      throw new Error("AttributePath step should always have an element");
    });
  });
};
var IncorrectType = class extends TypeError {
  constructor(type, path) {
    super(`${path.join(".")} should be a ${type}`);
  }
};
var formatInputState = (schema, state, includeSchemaFields = true, path = []) => {
  if (state === null) {
    return null;
  }
  if (typeof state === "undefined") {
    return null;
  }
  if (schema.type === "unknown") {
    return state;
  }
  if (schema.type === "string") {
    if (typeof state === "string") {
      return state;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "number") {
    if (typeof state === "number") {
      return state;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "boolean") {
    if (typeof state === "boolean") {
      return state;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "array") {
    if (Array.isArray(state)) {
      return state.map((item, i) => formatInputState(schema.item, item, includeSchemaFields, [...path, i]));
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "record") {
    if (typeof state === "object" && state !== null) {
      const record = {};
      for (const [key, value] of Object.entries(state)) {
        record[key] = formatInputState(schema.item, value, includeSchemaFields, [...path, key]);
      }
      return record;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "object" || schema.type === "array-object") {
    if (typeof state === "object" && state !== null) {
      const object = {};
      if (includeSchemaFields) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          const value = state[camelCase2(key)];
          object[key] = formatInputState(prop, value, true, [...path, key]);
        }
      } else {
        for (const [key, value] of Object.entries(state)) {
          const prop = schema.properties[snakeCase(key)];
          if (prop) {
            object[key] = formatInputState(prop, value, false, [...path, key]);
          }
        }
      }
      if (schema.type === "array-object") {
        return [object];
      }
      return object;
    }
    throw new IncorrectType(schema.type, path);
  }
  throw new Error(`Unknown schema type: ${schema.type}`);
};
var formatOutputState = (schema, state, path = []) => {
  if (state === null) {
    return void 0;
  }
  if (schema.type === "array") {
    if (Array.isArray(state)) {
      return state.map((item, i) => formatOutputState(schema.item, item, [...path, i]));
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "record") {
    if (typeof state === "object" && state !== null) {
      const record = {};
      for (const [key, value] of Object.entries(state)) {
        record[key] = formatOutputState(schema.item, value, [...path, key]);
      }
      return record;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "object") {
    if (typeof state === "object" && state !== null) {
      const object = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        const value = state[key];
        object[camelCase2(key)] = formatOutputState(prop, value, [...path, key]);
      }
      return object;
    }
    throw new IncorrectType(schema.type, path);
  }
  if (schema.type === "array-object") {
    if (Array.isArray(state)) {
      if (state.length === 1) {
        const object = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
          const value = state[0][key];
          object[camelCase2(key)] = formatOutputState(prop, value, [...path, key]);
        }
        return object;
      } else {
        return void 0;
      }
    }
    throw new IncorrectType(schema.type, path);
  }
  return state;
};

// src/plugin/version/5.ts
var createPlugin5 = async ({
  server,
  client
}) => {
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
      const prepared = await client.call("PrepareProviderConfig", {
        config: encodeDynamicValue(formatInputState(provider, config))
      });
      await client.call("Configure", {
        config: prepared.preparedConfig
      });
    },
    async readResource(type, state) {
      const schema2 = getResourceSchema(resources, type);
      const read = await client.call("ReadResource", {
        typeName: type,
        currentState: encodeDynamicValue(formatInputState(schema2, state))
      });
      return formatOutputState(schema2, decodeDynamicValue(read.newState));
    },
    async readDataSource(type, state) {
      const schema2 = getResourceSchema(dataSources, type);
      const read = await client.call("ReadDataSource", {
        typeName: type,
        config: encodeDynamicValue(formatInputState(schema2, state))
      });
      return formatOutputState(schema2, decodeDynamicValue(read.state));
    },
    async validateResource(type, state) {
      const schema2 = getResourceSchema(resources, type);
      await client.call("ValidateResourceTypeConfig", {
        typeName: type,
        config: encodeDynamicValue(formatInputState(schema2, state))
      });
    },
    async planResourceChange(type, priorState, proposedState) {
      const schema2 = getResourceSchema(resources, type);
      const preparedPriorState = formatInputState(schema2, priorState);
      const preparedProposedState = formatInputState(schema2, proposedState);
      const plan = await client.call("PlanResourceChange", {
        typeName: type,
        priorState: encodeDynamicValue(preparedPriorState),
        proposedNewState: encodeDynamicValue(preparedProposedState),
        config: encodeDynamicValue(preparedProposedState)
      });
      const plannedState = decodeDynamicValue(plan.plannedState);
      const requiresReplace = formatAttributePath(plan.requiresReplace);
      return {
        requiresReplace,
        plannedState
      };
    },
    async applyResourceChange(type, priorState, proposedState) {
      const schema2 = getResourceSchema(resources, type);
      const preparedPriorState = formatInputState(schema2, priorState);
      const preparedProposedState = formatInputState(schema2, proposedState);
      const apply = await client.call("ApplyResourceChange", {
        typeName: type,
        priorState: encodeDynamicValue(preparedPriorState),
        plannedState: encodeDynamicValue(preparedProposedState),
        config: encodeDynamicValue(preparedProposedState)
      });
      return formatOutputState(schema2, decodeDynamicValue(apply.newState));
    }
  };
};

// src/plugin/version/6.ts
var createPlugin6 = async ({
  server,
  client
}) => {
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
      const prepared = await client.call("ValidateProviderConfig", {
        config: encodeDynamicValue(formatInputState(provider, config))
      });
      await client.call("ConfigureProvider", {
        config: prepared.preparedConfig
      });
    },
    async readResource(type, state) {
      const schema2 = getResourceSchema(resources, type);
      const read = await client.call("ReadResource", {
        typeName: type,
        currentState: encodeDynamicValue(formatInputState(schema2, state))
      });
      return formatOutputState(schema2, decodeDynamicValue(read.newState));
    },
    async readDataSource(type, state) {
      const schema2 = getResourceSchema(dataSources, type);
      const read = await client.call("ReadDataSource", {
        typeName: type,
        config: encodeDynamicValue(formatInputState(schema2, state))
      });
      return formatOutputState(schema2, decodeDynamicValue(read.state));
    },
    async validateResource(type, state) {
      const schema2 = getResourceSchema(resources, type);
      await client.call("ValidateResourceConfig", {
        typeName: type,
        config: encodeDynamicValue(formatInputState(schema2, state))
      });
    },
    async planResourceChange(type, priorState, proposedState) {
      const schema2 = getResourceSchema(resources, type);
      const preparedPriorState = formatInputState(schema2, priorState);
      const preparedProposedState = formatInputState(schema2, proposedState);
      const plan = await client.call("PlanResourceChange", {
        typeName: type,
        priorState: encodeDynamicValue(preparedPriorState),
        proposedNewState: encodeDynamicValue(preparedProposedState),
        config: encodeDynamicValue(preparedProposedState)
      });
      const plannedState = decodeDynamicValue(plan.plannedState);
      const requiresReplace = formatAttributePath(plan.requiresReplace);
      return {
        requiresReplace,
        plannedState
      };
    },
    async applyResourceChange(type, priorState, proposedState) {
      const schema2 = getResourceSchema(resources, type);
      const preparedPriorState = formatInputState(schema2, priorState);
      const preparedProposedState = formatInputState(schema2, proposedState);
      const apply = await client.call("ApplyResourceChange", {
        typeName: type,
        priorState: encodeDynamicValue(preparedPriorState),
        plannedState: encodeDynamicValue(preparedProposedState),
        config: encodeDynamicValue(preparedProposedState)
      });
      return formatOutputState(schema2, decodeDynamicValue(apply.newState));
    }
    // async applyResourceChange(
    // 	type: string,
    // 	priorState: Record<string, unknown> | null,
    // 	proposedState: Record<string, unknown> | null
    // ) {
    // 	const schema = getResourceSchema(resources, type)
    // 	const preparedPriorState = formatInputState(schema, priorState)
    // 	const preparedProposedState = formatInputState(schema, proposedState)
    // 	const plan = await client.call('PlanResourceChange', {
    // 		typeName: type,
    // 		priorState: encodeDynamicValue(preparedPriorState),
    // 		proposedNewState: encodeDynamicValue(preparedProposedState),
    // 		config: encodeDynamicValue(preparedProposedState),
    // 	})
    // 	const plannedState = decodeDynamicValue(plan.plannedState)
    // 	const apply = await client.call('ApplyResourceChange', {
    // 		typeName: type,
    // 		priorState: encodeDynamicValue(preparedPriorState),
    // 		plannedState: encodeDynamicValue(plannedState),
    // 		config: encodeDynamicValue(plannedState),
    // 	})
    // 	return formatOutputState(schema, decodeDynamicValue(apply.newState))
    // },
  };
};

// src/lazy-plugin.ts
var createLazyPlugin = (props) => {
  return async () => {
    const { file } = await downloadPlugin(props);
    const server = await retry(3, () => createPluginServer({ file, debug: false }));
    const client = await retry(3, () => createPluginClient(server));
    const plugins = {
      5: () => createPlugin5({ server, client }),
      6: () => createPlugin6({ server, client })
    };
    const plugin = await plugins[server.version]?.();
    if (!plugin) {
      throw new Error(`No plugin client available for protocol version ${server.version}`);
    }
    return plugin;
  };
};
var retry = async (tries, cb) => {
  let latestError;
  while (--tries) {
    try {
      const result = await cb();
      return result;
    } catch (error) {
      latestError = error;
    }
  }
  throw latestError;
};

// src/proxy.ts
var createResourceProxy = (cb) => {
  return new Proxy(
    {},
    {
      get(_, key) {
        return cb(key);
      },
      set(_, key) {
        if (typeof key === "string") {
          throw new Error(`Cannot set property ${key} on read-only object.`);
        }
        throw new Error(`This object is read-only.`);
      }
    }
  );
};
var createNamespaceProxy = (cb) => {
  const cache = /* @__PURE__ */ new Map();
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key === "string") {
          if (!cache.has(key)) {
            const value = cb(key);
            cache.set(key, value);
          }
          return cache.get(key);
        }
        return;
      },
      set(_, key) {
        if (typeof key === "string") {
          throw new Error(`Cannot set property ${key} on read-only object.`);
        }
        throw new Error(`This object is read-only.`);
      }
    }
  );
};
var createRootProxy = (apply, get) => {
  const cache = /* @__PURE__ */ new Map();
  return new Proxy(() => {
  }, {
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
      return;
    }
  });
};
var createClassProxy = (construct, get) => {
  return new Proxy(class {
  }, {
    construct(_, args) {
      return construct(...args);
    },
    get(_, key) {
      if (key === "get") {
        return (...args) => {
          return get(...args);
        };
      }
      return;
    }
  });
};
var createRecursiveProxy = ({
  provider,
  install,
  uninstall,
  isInstalled,
  resource,
  dataSource
}) => {
  const findNextProxy = (ns, name) => {
    if (name === name.toLowerCase()) {
      return createNamespaceProxy((key) => {
        return findNextProxy([...ns, name], key);
      });
    } else if (name.startsWith("get")) {
      return (...args) => {
        return dataSource([...ns, name.substring(3)], ...args);
      };
    } else {
      return createClassProxy(
        (...args) => {
          return resource([...ns, name], ...args);
        },
        (...args) => {
          return dataSource([...ns, name], ...args);
        }
      );
    }
  };
  return createRootProxy(provider, (key) => {
    if (key === "install") {
      return install;
    }
    if (key === "uninstall") {
      return uninstall;
    }
    if (key === "isInstalled") {
      return isInstalled;
    }
    return findNextProxy([], key);
  });
};
var createTerraformProxy = (props) => {
  return createRecursiveProxy({
    provider(input, config) {
      return new TerraformProvider(
        props.namespace,
        config?.id ?? "default",
        createLazyPlugin({
          ...props.provider,
          location: config?.location
        }),
        input
      );
    },
    async install(installProps) {
      await downloadPlugin({ ...props.provider, ...installProps });
    },
    async uninstall(installProps) {
      await deletePlugin({ ...props.provider, ...installProps });
    },
    async isInstalled(installProps) {
      return await isPluginInstalled({ ...props.provider, ...installProps });
    },
    resource: (ns, parent, id, input, config) => {
      const type = snakeCase2([props.namespace, ...ns].join("_"));
      const provider = `terraform:${props.namespace}:${config?.provider ?? "default"}`;
      const meta = createMeta("resource", provider, parent, type, id, input, config);
      const resource = createResourceProxy((key) => {
        if (typeof key === "string") {
          return meta.output((data) => data[key]);
        } else if (key === nodeMetaSymbol) {
          return meta;
        }
        return;
      });
      parent.add(resource);
      return resource;
    },
    dataSource: (ns, parent, id, input, config) => {
      const type = snakeCase2([props.namespace, ...ns].join("_"));
      const provider = `terraform:${props.namespace}:${config?.provider ?? "default"}`;
      const meta = createMeta("data", provider, parent, type, id, input, config);
      const dataSource = createResourceProxy((key) => {
        if (typeof key === "string") {
          return meta.output((data) => data[key]);
        } else if (key === nodeMetaSymbol) {
          return meta;
        }
        return;
      });
      parent.add(dataSource);
      return dataSource;
    }
  });
};
export {
  TerraformProvider,
  createTerraformProxy,
  generateTypes
};

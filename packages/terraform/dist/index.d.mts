import { CreateProps, DeleteProps, GetDataProps, GetProps, PlanProps, Provider, RefreshResourceProps, State, UpdateProps } from "@terraforge/core";
//#region src/plugin/schema.d.ts
type RootProperty = {
  type: 'object';
  version?: number;
  description?: string;
  properties: Record<string, Property>;
};
type Property = {
  description?: string;
  required?: boolean;
  optional?: boolean;
  /** The computed field means that it could be computed by the server. */
  computed?: boolean;
  deprecated?: boolean;
  sensitive?: boolean;
  /**
   * True when the property comes from a nested block. Terraform never
   * sends null blocks to providers — absent blocks are encoded as empty
   * collections, and provider code relies on that invariant.
   */
  block?: boolean;
} & ({
  type: 'string' | 'number' | 'boolean';
} | {
  type: 'array' | 'record';
  item: Property;
  collectionKind?: 'list' | 'set';
} | {
  type: 'object' | 'array-object';
  properties: Record<string, Property>;
} | {
  type: 'unknown';
});
//#endregion
//#region src/type-gen.d.ts
declare const generateTypes: (namespace: string, provider: Property, resources: Record<string, Property>, dataSources: Record<string, Property>) => string;
//#endregion
//#region src/plugin/version/type.d.ts
type State$1 = Record<string, unknown>;
type Plugin = Readonly<{
  schema: () => {
    provider: Property;
    resources: Record<string, RootProperty>;
    dataSources: Record<string, RootProperty>;
  };
  stop: () => Promise<void>;
  configure: (config: State$1) => Promise<void>;
  readResource: (type: string, state: State$1) => Promise<State$1>;
  readDataSource: (type: string, state: State$1) => Promise<State$1>;
  validateResource: (type: string, state: State$1) => Promise<void>;
  planResourceChange: (type: string, priorState: State$1 | null, proposedNewState: State$1 | null, configState: State$1 | null) => Promise<{
    requiresReplace: Array<string | number>[];
    plannedState: State$1;
    rawPlannedState?: unknown;
  }>;
  applyResourceChange: (type: string, priorState: State$1 | null, plannedState: State$1 | null, configState: State$1 | null, rawPlannedState?: unknown) => Promise<State$1>;
}>;
//#endregion
//#region src/provider.d.ts
declare class TerraformProvider implements Provider {
  private type;
  private id;
  private createPlugin;
  private config;
  private configured?;
  private plugin?;
  constructor(type: string, id: string, createPlugin: () => Promise<Plugin>, config: State);
  private configure;
  private prepare;
  destroy(): Promise<void>;
  ownResource(id: string): boolean;
  getResource({ type, state }: GetProps): Promise<{
    version: number;
    state: State$1;
  }>;
  createResource({ type, state }: CreateProps): Promise<{
    version: number;
    state: State$1;
  }>;
  updateResource({ type, priorState, proposedState }: UpdateProps): Promise<{
    version: number;
    state: State$1;
  }>;
  deleteResource({ type, state }: DeleteProps): Promise<void>;
  planResourceChange({ type, priorState, proposedState }: PlanProps): Promise<{
    version: number;
    requiresReplacement: boolean;
    state: State$1;
  }>;
  getData({ type, state }: GetDataProps): Promise<{
    state: State$1;
  }>;
  refreshResource({ type, priorInputState, priorOutputState }: RefreshResourceProps): Promise<{
    kind: 'deleted';
    state?: undefined;
    inputState?: undefined;
  } | {
    kind: 'unchanged';
    state: State$1;
    inputState?: undefined;
  } | {
    kind: 'updated';
    state: State$1;
    inputState: State;
  }>;
}
//#endregion
//#region src/plugin/registry.d.ts
type Version = `${number}.${number}.${number}`;
//#endregion
//#region src/proxy.d.ts
type TerraformProviderConfig = {
  id?: string;
  location?: string;
};
type InstallProps = {
  location?: string;
};
declare const createTerraformProxy: (props: {
  namespace: string;
  provider: {
    org: string;
    type: string;
    version: Version;
  };
}) => () => void;
//#endregion
export { type InstallProps, TerraformProvider, type TerraformProviderConfig, createTerraformProxy, generateTypes };
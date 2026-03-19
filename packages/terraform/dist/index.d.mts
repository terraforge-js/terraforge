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
  }>;
  applyResourceChange: (type: string, priorState: State$1 | null, plannedState: State$1 | null, configState: State$1 | null) => Promise<State$1>;
}>;
//#endregion
//#region ../core/src/future.d.ts
declare class Future<T = unknown> {
  protected callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void;
  protected listeners: Set<{
    resolve: (data: T) => void;
    reject?: (error: unknown) => void;
  }>;
  protected status: 0 | 1 | 2 | 3;
  protected data?: T;
  protected error?: unknown;
  constructor(callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void);
  get [Symbol.toStringTag](): string;
  pipe<N>(cb: (value: T) => N): Future<Awaited<N>>;
  then(resolve: (data: T) => void, reject?: (error: unknown) => void): void;
}
//#endregion
//#region ../core/src/input.d.ts
type Input<T = unknown> = T | Output<T> | Future<T> | Promise<T>;
type UnwrapInputArray<T extends Input[]> = { [K in keyof T]: UnwrapInput<T[K]> };
type UnwrapInput<T> = T extends Input<infer V> ? V : T;
//#endregion
//#region ../core/src/output.d.ts
declare class Output<T = unknown> extends Future<T> {
  readonly dependencies: Set<Meta>;
  constructor(dependencies: Set<Meta>, callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void);
  pipe<N>(cb: (value: T) => N): Output<Awaited<N>>;
}
declare const combine: <T extends Input[], R = UnwrapInputArray<T>>(...inputs: T) => Output<R>;
declare const resolve: <T extends [Input, ...Input[]], R>(inputs: T, transformer: (...inputs: UnwrapInputArray<T>) => R) => Output<Awaited<R>>;
declare const interpolate: (literals: TemplateStringsArray, ...placeholders: Input<any>[]) => Output<string>;
//#endregion
//#region ../core/src/urn.d.ts
type URN = `urn:${string}`;
//#endregion
//#region ../core/src/node.d.ts
declare const nodeMetaSymbol: unique symbol;
type Node<T extends Tag = Tag, O extends State = State> = {
  readonly [nodeMetaSymbol]: Meta<T>;
  readonly urn: URN;
} & O;
//#endregion
//#region ../core/src/resource.d.ts
type ResourceConfig = Config & {
  /** Import an existing resource instead of creating a new resource. */
  import?: string;
  /** If true the resource will be retained in the backing cloud provider during a delete operation. */
  retainOnDelete?: boolean;
  /** If set, the provider’s Delete method will not be called for this resource if the specified resource is being deleted as well. */
  /** Declare that changes to certain properties should be treated as forcing a replacement. */
  replaceOnChanges?: string[];
  /** If true, create the replacement before deleting the existing resource. */
  createBeforeReplace?: boolean;
};
type ResourceMeta = Meta<'resource', ResourceConfig>;
type Resource<O extends State = State> = O & {
  readonly [nodeMetaSymbol]: ResourceMeta;
  readonly urn: URN;
};
//#endregion
//#region ../core/src/stack.d.ts
declare class Stack extends Group {
  readonly app: App;
  readonly dependencies: Set<Stack>;
  constructor(app: App, name: string);
}
//#endregion
//#region ../core/src/meta.d.ts
type Tag = 'resource' | 'data';
type State = Record<string, any>;
type Config = {
  /** Specify additional explicit dependencies in addition to the ones in the dependency graph. */
  dependsOn?: Array<Resource | DataSource>;
  /** Pass an ID of an explicitly configured provider, instead of using the default provider. */
  provider?: string;
};
type Meta<T extends Tag = Tag, C extends Config = Config> = {
  readonly tag: T;
  readonly urn: URN;
  readonly logicalId: string;
  readonly type: string;
  readonly stack: Stack;
  readonly provider: string;
  readonly input: State;
  readonly config?: C;
  readonly dependencies: Set<URN>;
  readonly resolve: (data: State) => void;
  readonly output: <V>(cb: (data: State) => V) => Output<V>;
};
//#endregion
//#region ../core/src/data-source.d.ts
type DataSourceMeta = Meta<'data'>;
type DataSource<O extends State = State> = {
  readonly [nodeMetaSymbol]: DataSourceMeta;
  readonly urn: URN;
} & O;
//#endregion
//#region ../core/src/group.d.ts
declare class Group {
  readonly parent: Group | undefined;
  readonly type: string;
  readonly name: string;
  protected children: Array<Group | Node>;
  constructor(parent: Group | undefined, type: string, name: string);
  get urn(): URN;
  protected addChild(child: Group | Node): void;
  add(...children: Array<Group | Node>): void;
  get nodes(): Node[];
  get resources(): Resource[];
  get dataSources(): DataSource[];
}
//#endregion
//#region ../core/src/app.d.ts
declare class App extends Group {
  readonly name: string;
  constructor(name: string);
  get stacks(): Stack[];
}
//#endregion
//#region ../core/src/provider.d.ts
type CreateProps<T = State> = {
  type: string;
  state: T;
  idempotantToken?: string;
};
type UpdateProps<T = State> = {
  type: string;
  priorState: T;
  proposedState: T;
  idempotantToken?: string;
};
type DeleteProps<T = State> = {
  type: string;
  state: T;
  idempotantToken?: string;
};
type PlanProps<T = State> = {
  type: string;
  priorState: T;
  proposedState: T;
};
type GetProps<T = State> = {
  type: string;
  state: T;
};
type GetDataProps<T = State> = {
  type: string;
  state: T;
};
type RefreshResourceProps<T = State> = {
  type: string;
  priorInputState: T;
  priorOutputState: T;
};
type RefreshResourceResult<T = State> = {
  kind: 'unchanged';
  state: T;
} | {
  kind: 'updated';
  state: T;
  inputState: T;
} | {
  kind: 'deleted';
};
interface Provider {
  ownResource(id: string): boolean;
  getResource(props: GetProps): Promise<{
    version: number;
    state: State;
  }>;
  createResource(props: CreateProps): Promise<{
    version: number;
    state: State;
  }>;
  updateResource(props: UpdateProps): Promise<{
    version: number;
    state: State;
  }>;
  deleteResource(props: DeleteProps): Promise<void>;
  planResourceChange?(props: PlanProps): Promise<{
    version: number;
    state: State;
    requiresReplacement: boolean;
  }>;
  getData?(props: GetDataProps): Promise<{
    state: State;
  }>;
  refreshResource?(props: RefreshResourceProps): Promise<RefreshResourceResult | undefined>;
  destroy?(): Promise<void>;
}
//#endregion
//#region ../core/src/helpers.d.ts
declare const file: (path: string, encoding?: BufferEncoding) => Future<string>;
declare const hash: (path: string, algo?: string) => Future<string>;
//#endregion
//#region ../core/src/globals.d.ts
declare global {
  var $resolve: typeof resolve;
  var $combine: typeof combine;
  var $interpolate: typeof interpolate;
  var $hash: typeof hash;
  var $file: typeof file;
}
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
  getResource({
    type,
    state
  }: GetProps): Promise<{
    version: number;
    state: State$1;
  }>;
  createResource({
    type,
    state
  }: CreateProps): Promise<{
    version: number;
    state: State$1;
  }>;
  updateResource({
    type,
    priorState,
    proposedState
  }: UpdateProps): Promise<{
    version: number;
    state: State$1;
  }>;
  deleteResource({
    type,
    state
  }: DeleteProps): Promise<void>;
  planResourceChange({
    type,
    priorState,
    proposedState
  }: PlanProps): Promise<{
    version: number;
    requiresReplacement: boolean;
    state: State$1;
  }>;
  getData({
    type,
    state
  }: GetDataProps): Promise<{
    state: State$1;
  }>;
  refreshResource({
    type,
    priorInputState,
    priorOutputState
  }: RefreshResourceProps): Promise<{
    kind: "deleted";
    state?: undefined;
    inputState?: undefined;
  } | {
    kind: "unchanged";
    state: State$1;
    inputState?: undefined;
  } | {
    kind: "updated";
    state: State$1;
    inputState: State;
  }>;
}
//#endregion
//#region src/plugin/registry.d.ts
type Version = `${number}.${number}.${number}` | 'latest';
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
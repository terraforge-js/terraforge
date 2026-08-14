import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { UUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";

//#region src/future.d.ts
declare class Future<T = unknown> {
  protected callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void;
  readonly volatile: boolean;
  protected listeners: Set<{
    resolve: (data: T) => void;
    reject?: (error: unknown) => void;
  }>;
  protected status: 0 | 1 | 2 | 3;
  protected data?: T;
  protected error?: unknown;
  constructor(callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void, volatile?: boolean);
  get [Symbol.toStringTag](): string;
  pipe<N>(cb: (value: T) => N): Future<Awaited<N>>;
  then(resolve: (data: T) => void, reject?: (error: unknown) => void): void;
}
//#endregion
//#region src/input.d.ts
type Input<T = unknown> = T | Output<T> | Future<T> | Promise<T>;
type OptionalInput<T = unknown> = Input<T> | Input<T | undefined> | Input<undefined>;
type UnwrapInputArray<T extends Input[]> = { [K in keyof T]: UnwrapInput<T[K]> };
type UnwrapInput<T> = T extends Input<infer V> ? V : T;
declare const findInputDeps: (props: unknown) => Meta[];
declare const resolveInputs: <T>(inputs: T, fallback?: (path: Array<string | number>) => unknown) => Promise<T>;
//#endregion
//#region src/output.d.ts
type OptionalOutput<T = unknown> = Output<T | undefined>;
declare class Output<T = unknown> extends Future<T> {
  readonly dependencies: Set<Meta>;
  constructor(dependencies: Set<Meta>, callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void, volatile?: boolean);
  pipe<N>(cb: (value: T) => N): Output<Awaited<N>>;
}
declare const deferredOutput: <T>(cb: (resolve: (data: T) => void) => void) => Output<T>;
declare const output: <T>(value: T) => Output<T>;
declare const combine: <T extends Input[], R = UnwrapInputArray<T>>(...inputs: T) => Output<R>;
declare const resolve: <T extends [Input, ...Input[]], R>(inputs: T, transformer: (...inputs: UnwrapInputArray<T>) => R) => Output<Awaited<R>>;
declare const interpolate: (literals: TemplateStringsArray, ...placeholders: Input<any>[]) => Output<string>;
//#endregion
//#region src/urn.d.ts
type URN = `urn:${string}`;
//#endregion
//#region src/node.d.ts
declare const nodeMetaSymbol: unique symbol;
type Node<T extends Tag = Tag, O extends State = State> = {
  readonly [nodeMetaSymbol]: Meta<T>;
  readonly urn: URN;
} & O;
declare const isNode: (obj: object) => obj is {
  [nodeMetaSymbol]: Meta;
};
declare function getMeta(node: Resource): ResourceMeta;
declare function getMeta(node: DataSource): DataSourceMeta;
declare function getMeta(node: Node): Meta;
declare const isResource: (obj: object) => obj is Resource;
declare const isDataSource: (obj: object) => obj is DataSource;
//#endregion
//#region src/resource.d.ts
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
type ResourceClass<I extends State = State, O extends State = State> = {
  new (parent: Group, id: string, props: I, config?: ResourceConfig): Resource<O>;
  get(parent: Group, id: string, physicalId: string): DataSource<O>;
};
//#endregion
//#region src/stack.d.ts
declare class Stack extends Group {
  readonly app: App;
  readonly dependencies: Set<Stack>;
  constructor(app: App, name: string);
}
//#endregion
//#region src/meta.d.ts
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
declare const createMeta: <T extends Tag = Tag, C extends Config = Config>(tag: T, provider: string, parent: Group, type: string, logicalId: string, input: State, config?: C) => Meta<T, C>;
//#endregion
//#region src/data-source.d.ts
type DataSourceMeta = Meta<'data'>;
type DataSource<O extends State = State> = {
  readonly [nodeMetaSymbol]: DataSourceMeta;
  readonly urn: URN;
} & O;
type DataSourceFunction<I extends State = State, O extends State = State> = (parent: Group, id: string, input: I, config?: Config) => DataSource<O>;
//#endregion
//#region src/group.d.ts
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
//#region src/app.d.ts
declare class App extends Group {
  readonly name: string;
  constructor(name: string);
  get stacks(): Stack[];
}
//#endregion
//#region src/debug.d.ts
type DebugSink = (group: string, ...args: unknown[]) => void;
declare const enableDebug: (customSink?: DebugSink) => void;
declare const disableDebug: () => void;
declare const createDebugger: (group: string) => (...args: unknown[]) => void;
//#endregion
//#region src/workspace/procedure/status.d.ts
/**
 * The status of a resource comparing local config with state file.
 *
 * - `created`: Resource exists in state and matches current config
 * - `changed`: Resource exists in state but config has changed
 * - `pending`: Resource exists in config but not yet deployed (no state)
 * - `stale`: Resource exists in state but was removed from config
 */
type ResourceStatus = 'created' | 'changed' | 'pending' | 'stale';
type ResourceStatusInfo = {
  urn: URN;
  type: string;
  provider: string;
  tag: 'resource' | 'data';
  status: ResourceStatus;
};
type StackStatusInfo = {
  name: string;
  urn: URN;
  resources: ResourceStatusInfo[];
};
//#endregion
//#region src/backend/lock.d.ts
declare class AlreadyLockedError extends Error {
  readonly urn: URN;
  constructor(urn: URN);
}
type LockBackend = {
  insecureReleaseLock(urn: URN): Promise<void>;
  locked(urn: URN): Promise<boolean>;
  lock(urn: URN): Promise<() => Promise<void>>;
};
//#endregion
//#region src/workspace/state.d.ts
type AppState = {
  name: string;
  version?: number;
  idempotentToken?: UUID;
  stacks: Record<URN, StackState>;
  pendingDeletes?: Record<URN, NodeState>;
};
type StackState = {
  name: string;
  nodes: Record<URN, NodeState>;
};
type NodeState = {
  tag: 'resource' | 'data';
  type: string;
  version?: number;
  provider: string;
  input: State;
  output: State;
  drifted?: boolean;
  dependencies: URN[];
  lifecycle?: {
    retainOnDelete?: boolean;
    deleteAfterCreate?: boolean;
  };
};
//#endregion
//#region src/backend/state.d.ts
type StateBackend = {
  get(urn: URN): Promise<AppState | undefined>;
  update(urn: URN, state: AppState): Promise<void>;
  delete(urn: URN): Promise<void>;
};
//#endregion
//#region src/backend/activity-log.d.ts
type LogProps = {
  action: 'deploy' | 'delete';
  filters?: string[];
};
type Log = LogProps & {
  user?: string;
  date: number;
};
type ActivityLogBackend = {
  log(urn: URN, log: LogProps): Promise<void>;
  tail(urn: URN, limit?: number): Promise<Log[]>;
};
//#endregion
//#region src/provider.d.ts
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
//#region src/workspace/hooks.d.ts
type ResourceEvent = {
  urn: URN;
  type: string;
};
type BeforeResourceCreateEvent = ResourceEvent & {
  resource: Resource;
  newInput: State;
};
type AfterResourceCreateEvent = ResourceEvent & {
  resource: Resource;
  newInput: State;
  newOutput: State;
};
type BeforeResourceUpdateEvent = ResourceEvent & {
  resource: Resource;
  oldInput: State;
  newInput: State;
  oldOutput: State;
};
type AfterResourceUpdateEvent = ResourceEvent & {
  resource: Resource;
  oldInput: State;
  newInput: State;
  oldOutput: State;
  newOutput: State;
};
type BeforeResourceDeleteEvent = ResourceEvent & {
  oldInput: State;
  oldOutput: State;
};
type AfterResourceDeleteEvent = ResourceEvent & {
  oldInput: State;
  oldOutput: State;
};
type Hooks = {
  beforeResourceCreate?: (event: BeforeResourceCreateEvent) => Promise<void> | void;
  beforeResourceUpdate?: (event: BeforeResourceUpdateEvent) => Promise<void> | void;
  beforeResourceDelete?: (event: BeforeResourceDeleteEvent) => Promise<void> | void;
  afterResourceCreate?: (event: AfterResourceCreateEvent) => Promise<void> | void;
  afterResourceUpdate?: (event: AfterResourceUpdateEvent) => Promise<void> | void;
  afterResourceDelete?: (event: AfterResourceDeleteEvent) => Promise<void> | void;
};
//#endregion
//#region src/workspace/workspace.d.ts
type ProcedureOptions = {
  filters?: string[];
  idempotentToken?: UUID;
};
type WorkSpaceOptions = {
  providers: Provider[];
  concurrency?: number;
  backend: {
    state: StateBackend;
    lock: LockBackend;
    activityLog?: ActivityLogBackend;
  };
  hooks?: Hooks;
};
declare class WorkSpace {
  protected props: WorkSpaceOptions;
  constructor(props: WorkSpaceOptions);
  /**
   * Deploy the entire app or use the filter option to deploy specific stacks inside your app.
   */
  deploy(app: App, options?: ProcedureOptions): Promise<void>;
  /**
   * Delete the entire app or use the filter option to delete specific stacks inside your app.
   */
  delete(app: App, options?: ProcedureOptions): Promise<void>;
  /**
   * Hydrate the outputs of the resources & data-sources inside your app.
   */
  hydrate(app: App): Promise<void>;
  /**
   * Refresh the state of the resources & data-sources inside your app.
   */
  refresh(app: App, options?: ProcedureOptions): Promise<{
    operations: ({
      urn: URN;
      operation: "delete";
      commit(): void;
    } | {
      urn: URN;
      operation: "update";
      before: State;
      after: State;
      commit(): void;
    })[];
    commit: () => Promise<void>;
    discard: () => Promise<void>;
  } | undefined>;
  /**
   * Get the status of all resources in the app by comparing current config with state file.
   */
  status(app: App): Promise<StackStatusInfo[]>;
  protected destroyProviders(): Promise<void>;
}
//#endregion
//#region src/workspace/operation.d.ts
type ResourceOperation = 'create' | 'update' | 'delete' | 'replace' | 'import' | 'resolve' | 'get';
//#endregion
//#region src/workspace/error.d.ts
declare class ResourceError extends Error {
  readonly urn: URN;
  readonly type: string;
  readonly operation: ResourceOperation;
  static wrap(urn: URN, type: string, operation: ResourceOperation, error: unknown): ResourceError;
  constructor(urn: URN, type: string, operation: ResourceOperation, message: string);
}
declare class AppError extends Error {
  readonly app: string;
  readonly issues: (ResourceError | Error)[];
  constructor(app: string, issues: (ResourceError | Error)[], message: string);
}
declare class ResourceNotFound extends Error {}
declare class ResourceAlreadyExists extends Error {}
//#endregion
//#region src/backend/memory/activity-log.d.ts
type Props$4 = {
  user?: string;
};
declare class MemoryActivityLogBackend implements ActivityLogBackend {
  private props;
  protected groups: Map<`urn:${string}`, Log[]>;
  constructor(props?: Props$4);
  log(urn: URN, log: LogProps): Promise<void>;
  private getLogGroup;
  tail(urn: URN, limit?: number): Promise<Log[]>;
}
//#endregion
//#region src/backend/memory/state.d.ts
declare class MemoryStateBackend implements StateBackend {
  protected states: Map<`urn:${string}`, AppState>;
  get(urn: URN): Promise<AppState | undefined>;
  update(urn: URN, state: AppState): Promise<void>;
  delete(urn: URN): Promise<void>;
  clear(): void;
}
//#endregion
//#region src/backend/memory/lock.d.ts
declare class MemoryLockBackend implements LockBackend {
  protected locks: Map<`urn:${string}`, number>;
  insecureReleaseLock(urn: URN): Promise<void>;
  locked(urn: URN): Promise<boolean>;
  lock(urn: URN): Promise<() => Promise<void>>;
  clear(): void;
}
//#endregion
//#region src/backend/file/activity-log.d.ts
type Props$3 = {
  user?: string;
  dir: string;
};
declare class FileActivityLogBackend implements ActivityLogBackend {
  private props;
  constructor(props: Props$3);
  private logFile;
  private mkdir;
  log(urn: URN, log: LogProps): Promise<void>;
  tail(urn: URN, limit?: number): Promise<Log[]>;
}
//#endregion
//#region src/backend/file/state.d.ts
declare class FileStateBackend implements StateBackend {
  private props;
  constructor(props: {
    dir: string;
  });
  private stateFile;
  private mkdir;
  get(urn: URN): Promise<AppState | undefined>;
  update(urn: URN, state: AppState): Promise<void>;
  delete(urn: URN): Promise<void>;
}
//#endregion
//#region src/backend/file/lock.d.ts
declare class FileLockBackend implements LockBackend {
  private props;
  constructor(props: {
    dir: string;
  });
  private lockFile;
  private mkdir;
  insecureReleaseLock(urn: URN): Promise<void>;
  locked(urn: URN): Promise<boolean>;
  lock(urn: URN): Promise<() => Promise<void>>;
}
//#endregion
//#region src/backend/aws/dynamo-activity-log.d.ts
type Props$2 = {
  credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  region: string;
  tableName: string;
  user?: string;
};
declare class DynamoActivityLogBackend implements ActivityLogBackend {
  private props;
  protected client: DynamoDB;
  constructor(props: Props$2);
  log(urn: URN, log: LogProps): Promise<void>;
  tail(urn: URN, limit?: number): Promise<Log[]>;
}
//#endregion
//#region src/backend/aws/dynamo-lock.d.ts
type Props$1 = {
  credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  region: string;
  tableName: string;
  renewInterval?: number;
};
declare class DynamoLockBackend implements LockBackend {
  private props;
  protected client: DynamoDB;
  constructor(props: Props$1);
  insecureReleaseLock(urn: URN): Promise<void>;
  locked(urn: URN): Promise<boolean>;
  lock(urn: URN): Promise<() => Promise<void>>;
}
//#endregion
//#region src/backend/aws/s3-state.d.ts
type Props = {
  credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  region: string;
  bucket: string;
};
declare class S3StateBackend implements StateBackend {
  private props;
  protected client: S3Client;
  constructor(props: Props);
  get(urn: URN): Promise<any>;
  update(urn: URN, state: AppState): Promise<void>;
  delete(urn: URN): Promise<void>;
}
//#endregion
//#region src/helpers.d.ts
declare const file: (path: string, encoding?: BufferEncoding) => Future<string>;
declare const hash: (path: string, algo?: string) => Future<string>;
//#endregion
//#region src/globals.d.ts
declare global {
  var $resolve: typeof resolve;
  var $combine: typeof combine;
  var $interpolate: typeof interpolate;
  var $hash: typeof hash;
  var $file: typeof file;
}
//#endregion
//#region src/custom/resource.d.ts
declare const createCustomResourceClass: <I extends State, O extends State>(providerId: string, resourceType: string) => ResourceClass<I, O>;
//#endregion
//#region src/custom/provider.d.ts
type CustomResourceProvider = Partial<{
  getResource?(props: Omit<GetProps, 'type'>): Promise<State>;
  updateResource?(props: Omit<UpdateProps, 'type'>): Promise<State>;
  createResource?(props: Omit<CreateProps, 'type'>): Promise<State>;
  deleteResource?(props: Omit<DeleteProps, 'type'>): Promise<void>;
  getData?(props: Omit<GetDataProps, 'type'>): Promise<State>;
  planResourceChange?(props: Omit<PlanProps, 'type'>): Promise<{
    state: State;
    requiresReplacement: boolean;
  }>;
  refreshResource?(props: Omit<RefreshResourceProps, 'type'>): Promise<RefreshResourceResult<State> | undefined>;
}>;
declare const createCustomProvider: (providerId: string, resourceProviders: Record<string, CustomResourceProvider>) => Provider;
//#endregion
export { ActivityLogBackend, AlreadyLockedError, App, AppError, type Config, type CreateProps, type CustomResourceProvider, type DataSource, type DataSourceFunction, type DataSourceMeta, type DebugSink, type DeleteProps, DynamoActivityLogBackend, DynamoLockBackend, FileActivityLogBackend, FileLockBackend, FileStateBackend, Future, type GetDataProps, type GetProps, Group, type Input, LockBackend, Log, LogProps, MemoryActivityLogBackend, MemoryLockBackend, MemoryStateBackend, type Meta, type Node, type OptionalInput, type OptionalOutput, Output, type PlanProps, type ProcedureOptions, type Provider, type RefreshResourceProps, type RefreshResourceResult, type Resource, ResourceAlreadyExists, type ResourceClass, type ResourceConfig, ResourceError, type ResourceMeta, ResourceNotFound, type ResourceStatus, type ResourceStatusInfo, S3StateBackend, Stack, type StackStatusInfo, type State, StateBackend, type Tag, type URN, type UpdateProps, WorkSpace, type WorkSpaceOptions, createCustomProvider, createCustomResourceClass, createDebugger, createMeta, deferredOutput, disableDebug, enableDebug, findInputDeps, getMeta, isDataSource, isNode, isResource, nodeMetaSymbol, output, resolveInputs };
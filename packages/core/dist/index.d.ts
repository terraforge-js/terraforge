declare class Future<T = unknown> {
	protected callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void;
	protected listeners;
	protected status: 0 | 1 | 2 | 3;
	protected data?: T;
	protected error?: unknown;
	constructor(callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void);
	get [Symbol.toStringTag]();
	pipe<N>(cb: (value: T) => N);
	then(resolve: (data: T) => void, reject?: (error: unknown) => void);
}
type Input<T = unknown> = T | Output<T> | Future<T> | Promise<T>;
type OptionalInput<T = unknown> = Input<T> | Input<T | undefined> | Input<undefined>;
declare const findInputDeps: unknown;
declare const resolveInputs: <T>(inputs: T) => Promise<T>;
type OptionalOutput<T = unknown> = Output<T | undefined>;
declare class Output<T = unknown> extends Future<T> {
	readonly dependencies: Set<Meta>;
	constructor(dependencies: Set<Meta>, callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void);
	pipe<N>(cb: (value: T) => N);
}
declare const deferredOutput: unknown;
declare const output: unknown;
declare const nodeMetaSymbol: unknown;
type Node<
	T extends Tag = Tag,
	I extends State = State,
	O extends State = any,
	C extends Config = Config
> = {
	[nodeMetaSymbol]: Meta<T, I, O, C>;
} & O;
declare const isNode: (obj: object) => obj is {
	[nodeMetaSymbol]: Meta;
};
declare function getMeta(node: Resource): ResourceMeta;
declare function getMeta(node: DataSource): DataSourceMeta;
declare function getMeta(node: Node): Meta;
declare const isResource: (obj: object) => obj is Resource;
declare const isDataSource: (obj: object) => obj is DataSource;
type ResourceConfig = Config & {
	/** Import an existing resource instead of creating a new resource. */
	import?: string;
	/** If true the resource will be retained in the backing cloud provider during a Pulumi delete operation. */
	retainOnDelete?: boolean;
	/** Override the default create-after-delete behavior when replacing a resource. */
	/** If set, the provider’s Delete method will not be called for this resource if the specified resource is being deleted as well. */
	/** Declare that changes to certain properties should be treated as forcing a replacement. */
	replaceOnChanges?: string[];
};
type ResourceMeta<
	I extends State = State,
	O extends State = State
> = Meta<"resource", I, O, ResourceConfig>;
type Resource<
	I extends State = State,
	O extends State = State
> = O & {
	readonly [nodeMetaSymbol]: ResourceMeta<I, O>;
};
type ResourceClass<
	I extends State = State,
	O extends State = State
> = {
	new (parent: Group, id: string, props: I, config?: ResourceConfig): Resource<I, O>;
	get(parent: Group, id: string, physicalId: string): DataSource<I, O>;
};
declare class Stack extends Group {
	readonly app: App;
	readonly dependencies;
	constructor(app: App, name: string);
	dependsOn(...stacks: Stack[]);
}
type URN = `urn:${string}`;
type Tag = "resource" | "data";
type State = Record<string, unknown>;
type Config = {
	/** Specify additional explicit dependencies in addition to the ones in the dependency graph. */
	dependsOn?: Resource<any, any>[];
	/** Pass an ID of an explicitly configured provider, instead of using the default provider. */
	provider?: string;
};
type Meta<
	T extends Tag = Tag,
	I extends State = State,
	O extends State = State,
	C extends Config = Config
> = {
	readonly tag: T;
	readonly urn: URN;
	readonly logicalId: string;
	readonly type: string;
	readonly stack: Stack;
	readonly provider: string;
	readonly input: I;
	readonly config?: C;
	readonly dependencies: Set<URN>;
	readonly resolve: (data: O) => void;
	readonly output: <O>(cb: (data: State) => O) => Output<O>;
};
declare const createMeta: <
	T extends Tag = Tag,
	I extends State = State,
	O extends State = State,
	C extends Config = Config
>(tag: T, provider: string, parent: Group, type: string, logicalId: string, input: I, config?: C) => Meta<T, I, O, C>;
type DataSourceMeta<
	I extends State = State,
	O extends State = State
> = Meta<"data", I, O>;
type DataSource<
	I extends State = State,
	O extends State = State
> = {
	readonly [nodeMetaSymbol]: DataSourceMeta<I, O>;
} & O;
type DataSourceFunction<
	I extends State = State,
	O extends State = State
> = (parent: Group, id: string, input: I, config?: Config) => DataSource<I, O>;
declare class Group {
	readonly parent: Group | undefined;
	readonly type: string;
	readonly name: string;
	protected children: Array<Group | Node>;
	constructor(parent: Group | undefined, type: string, name: string);
	get urn(): URN;
	protected addChild(child: Group | Node);
	add(...children: Array<Group | Node>);
	get nodes(): Node[];
	get resources(): Resource[];
	get dataSources(): DataSource[];
}
declare class App extends Group {
	readonly name: string;
	constructor(name: string);
	get stacks(): Stack[];
}
declare const enableDebug: unknown;
declare const createDebugger: (group: string) => unknown;
import { UUID as UUID2 } from "node:crypto";
interface LockBackend {
	insecureReleaseLock(urn: URN): Promise<void>;
	locked(urn: URN): Promise<boolean>;
	lock(urn: URN): Promise<() => Promise<void>>;
}
import { UUID } from "node:crypto";
type AppState = {
	name: string;
	version?: number;
	idempotentToken?: UUID;
	stacks: Record<URN, StackState>;
};
type StackState = {
	name: string;
	nodes: Record<URN, NodeState>;
};
type NodeState = {
	tag: "resource" | "data";
	type: string;
	version?: number;
	provider: string;
	input: State;
	output: State;
	dependencies: URN[];
	lifecycle?: {
		retainOnDelete?: boolean;
		deleteAfterCreate?: boolean;
	};
};
type StateBackend = {
	get(urn: URN): Promise<AppState | undefined>;
	update(urn: URN, state: AppState): Promise<void>;
	delete(urn: URN): Promise<void>;
};
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
type GetProps<T = State> = {
	type: string;
	state: T;
};
type GetDataProps<T = State> = {
	type: string;
	state: T;
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
	getData?(props: GetDataProps): Promise<{
		state: State;
	}>;
	destroy?(): Promise<void>;
}
type ProcedureOptions = {
	filters?: string[];
	idempotentToken?: UUID2;
};
type WorkSpaceOptions = {
	providers: Provider[];
	concurrency?: number;
	backend: {
		state: StateBackend;
		lock: LockBackend;
	};
};
declare class WorkSpace {
	protected props: WorkSpaceOptions;
	constructor(props: WorkSpaceOptions);
	deploy(app: App, options?: ProcedureOptions);
	delete(app: App, options?: ProcedureOptions);
	hydrate(app: App);
	protected destroyProviders();
}
type ResourceOperation = "create" | "update" | "delete" | "replace" | "import" | "resolve" | "get";
declare class ResourceError extends Error {
	readonly urn: URN;
	readonly type: string;
	readonly operation: ResourceOperation;
	static wrap(urn: URN, type: string, operation: ResourceOperation, error: unknown);
	constructor(urn: URN, type: string, operation: ResourceOperation, message: string);
}
declare class AppError extends Error {
	readonly app: string;
	readonly issues: (ResourceError | Error)[];
	constructor(app: string, issues: (ResourceError | Error)[], message: string);
}
declare class ResourceNotFound extends Error {}
declare class ResourceAlreadyExists extends Error {}
declare class MemoryStateBackend implements StateBackend {
	protected states;
	get(urn: URN);
	update(urn: URN, state: AppState);
	delete(urn: URN);
	clear();
}
declare class MemoryLockBackend implements LockBackend {
	protected locks;
	insecureReleaseLock(urn: URN);
	locked(urn: URN);
	lock(urn: URN);
	clear();
}
declare class FileStateBackend implements StateBackend {
	private props;
	constructor(props: {
		dir: string;
	});
	private stateFile;
	private mkdir;
	get(urn: URN);
	update(urn: URN, state: AppState);
	delete(urn: URN);
}
declare class FileLockBackend implements LockBackend {
	private props;
	constructor(props: {
		dir: string;
	});
	private lockFile;
	private mkdir;
	insecureReleaseLock(urn: URN);
	locked(urn: URN);
	lock(urn: URN);
}
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { S3Client } from "@aws-sdk/client-s3";
type Props = {
	credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
	region: string;
	bucket: string;
};
declare class S3StateBackend implements StateBackend {
	private props;
	protected client: S3Client;
	constructor(props: Props);
	get(urn: URN);
	update(urn: URN, state: AppState);
	delete(urn: URN);
}
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { AwsCredentialIdentity as AwsCredentialIdentity2, AwsCredentialIdentityProvider as AwsCredentialIdentityProvider2 } from "@aws-sdk/types";
type Props2 = {
	credentials: AwsCredentialIdentity2 | AwsCredentialIdentityProvider2;
	region: string;
	tableName: string;
};
declare class DynamoLockBackend implements LockBackend {
	private props;
	protected client: DynamoDB;
	constructor(props: Props2);
	insecureReleaseLock(urn: URN);
	locked(urn: URN);
	lock(urn: URN);
}
declare const createCustomResourceClass: <
	I extends State,
	O extends State
>(providerId: string, resourceType: string) => ResourceClass<I, O>;
type CustomResourceProvider = Partial<{
	getResource?(props: Omit<GetProps, "type">): Promise<State>;
	updateResource?(props: Omit<UpdateProps, "type">): Promise<State>;
	createResource?(props: Omit<CreateProps, "type">): Promise<State>;
	deleteResource?(props: Omit<DeleteProps, "type">): Promise<void>;
	getData?(props: Omit<GetDataProps, "type">): Promise<State>;
}>;
declare const createCustomProvider: (providerId: string, resourceProviders: Record<string, CustomResourceProvider>) => Provider;
export { resolveInputs, output, nodeMetaSymbol, isResource, isNode, isDataSource, getMeta, findInputDeps, enableDebug, deferredOutput, createMeta, createDebugger, createCustomResourceClass, createCustomProvider, WorkSpaceOptions, WorkSpace, UpdateProps, URN, Tag, StateBackend, State, Stack, S3StateBackend, ResourceNotFound, ResourceMeta, ResourceError, ResourceConfig, ResourceClass, ResourceAlreadyExists, Resource, Provider, ProcedureOptions, Output, OptionalOutput, OptionalInput, Node, Meta, MemoryStateBackend, MemoryLockBackend, LockBackend, Input, Group, GetProps, GetDataProps, Future, FileStateBackend, FileLockBackend, DynamoLockBackend, DeleteProps, DataSourceMeta, DataSourceFunction, DataSource, CustomResourceProvider, CreateProps, Config, AppError, App };

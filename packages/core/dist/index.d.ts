import { UUID } from 'node:crypto';
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

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

type Input<T = unknown> = T | Output<T> | Future<T> | Promise<T>;
type OptionalInput<T = unknown> = Input<T> | Input<T | undefined> | Input<undefined>;
type UnwrapInputArray<T extends Input[]> = {
    [K in keyof T]: UnwrapInput<T[K]>;
};
type UnwrapInput<T> = T extends Input<infer V> ? V : T;
declare const findInputDeps: (props: unknown) => Meta[];
declare const resolveInputs: <T>(inputs: T) => Promise<T>;

type OptionalOutput<T = unknown> = Output<T | undefined>;
declare class Output<T = unknown> extends Future<T> {
    readonly dependencies: Set<Meta>;
    constructor(dependencies: Set<Meta>, callback: (resolve: (data: T) => void, reject: (error: unknown) => void) => void);
    pipe<N>(cb: (value: T) => N): Output<Awaited<N>>;
}
declare const deferredOutput: <T>(cb: (resolve: (data: T) => void) => void) => Output<T>;
declare const output: <T>(value: T) => Output<T>;
declare const combine: <T extends Input[], R = UnwrapInputArray<T>>(...inputs: T) => Output<R>;
declare const resolve: <T extends [Input, ...Input[]], R>(inputs: T, transformer: (...inputs: UnwrapInputArray<T>) => R) => Output<Awaited<R>>;
declare const interpolate: (literals: TemplateStringsArray, ...placeholders: Input<any>[]) => Output<string>;

type URN = `urn:${string}`;

declare const nodeMetaSymbol: unique symbol;
type Node<T extends Tag = Tag, I extends State = State, O extends State = any, C extends Config = Config> = {
    readonly [nodeMetaSymbol]: Meta<T, I, O, C>;
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
type ResourceMeta<I extends State = State, O extends State = State> = Meta<'resource', I, O, ResourceConfig>;
type Resource<I extends State = State, O extends State = State> = O & {
    readonly [nodeMetaSymbol]: ResourceMeta<I, O>;
    readonly urn: URN;
};
type ResourceClass<I extends State = State, O extends State = State> = {
    new (parent: Group, id: string, props: I, config?: ResourceConfig): Resource<I, O>;
    get(parent: Group, id: string, physicalId: string): DataSource<I, O>;
};

declare class Stack extends Group {
    readonly app: App;
    readonly dependencies: Set<Stack>;
    constructor(app: App, name: string);
    dependsOn(...stacks: Stack[]): this;
}

type Tag = 'resource' | 'data';
type State = Record<string, unknown>;
type Config = {
    /** Specify additional explicit dependencies in addition to the ones in the dependency graph. */
    dependsOn?: Resource<any, any>[];
    /** Pass an ID of an explicitly configured provider, instead of using the default provider. */
    provider?: string;
};
type Meta<T extends Tag = Tag, I extends State = State, O extends State = State, C extends Config = Config> = {
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
declare const createMeta: <T extends Tag = Tag, I extends State = State, O extends State = State, C extends Config = Config>(tag: T, provider: string, parent: Group, type: string, logicalId: string, input: I, config?: C) => Meta<T, I, O, C>;

type DataSourceMeta<I extends State = State, O extends State = State> = Meta<'data', I, O>;
type DataSource<I extends State = State, O extends State = State> = {
    readonly [nodeMetaSymbol]: DataSourceMeta<I, O>;
    readonly urn: URN;
} & O;
type DataSourceFunction<I extends State = State, O extends State = State> = (parent: Group, id: string, input: I, config?: Config) => DataSource<I, O>;

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

declare class App extends Group {
    readonly name: string;
    constructor(name: string);
    get stacks(): Stack[];
}

declare const enableDebug: () => void;
declare const createDebugger: (group: string) => (...args: unknown[]) => void;

interface LockBackend {
    insecureReleaseLock(urn: URN): Promise<void>;
    locked(urn: URN): Promise<boolean>;
    lock(urn: URN): Promise<() => Promise<void>>;
}

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
    tag: 'resource' | 'data';
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
    idempotentToken?: UUID;
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
    refresh(app: App): Promise<void>;
    protected destroyProviders(): Promise<void>;
}

type ResourceOperation = 'create' | 'update' | 'delete' | 'replace' | 'import' | 'resolve' | 'get';

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
declare class ResourceNotFound extends Error {
}
declare class ResourceAlreadyExists extends Error {
}

declare class MemoryStateBackend implements StateBackend {
    protected states: Map<`urn:${string}`, AppState>;
    get(urn: URN): Promise<AppState | undefined>;
    update(urn: URN, state: AppState): Promise<void>;
    delete(urn: URN): Promise<void>;
    clear(): void;
}

declare class MemoryLockBackend implements LockBackend {
    protected locks: Map<`urn:${string}`, number>;
    insecureReleaseLock(urn: URN): Promise<void>;
    locked(urn: URN): Promise<boolean>;
    lock(urn: URN): Promise<() => Promise<void>>;
    clear(): void;
}

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

type Props$1 = {
    credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
    region: string;
    bucket: string;
};
declare class S3StateBackend implements StateBackend {
    private props;
    protected client: S3Client;
    constructor(props: Props$1);
    get(urn: URN): Promise<any>;
    update(urn: URN, state: AppState): Promise<void>;
    delete(urn: URN): Promise<void>;
}

type Props = {
    credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;
    region: string;
    tableName: string;
};
declare class DynamoLockBackend implements LockBackend {
    private props;
    protected client: DynamoDB;
    constructor(props: Props);
    insecureReleaseLock(urn: URN): Promise<void>;
    locked(urn: URN): Promise<boolean>;
    lock(urn: URN): Promise<() => Promise<void>>;
}

declare const file: (path: string, encoding?: BufferEncoding) => Future<string>;
declare const hash: (path: string, algo?: string) => Future<string>;

declare global {
    var $resolve: typeof resolve;
    var $combine: typeof combine;
    var $interpolate: typeof interpolate;
    var $hash: typeof hash;
    var $file: typeof file;
}

declare const createCustomResourceClass: <I extends State, O extends State>(providerId: string, resourceType: string) => ResourceClass<I, O>;

type CustomResourceProvider = Partial<{
    getResource?(props: Omit<GetProps, 'type'>): Promise<State>;
    updateResource?(props: Omit<UpdateProps, 'type'>): Promise<State>;
    createResource?(props: Omit<CreateProps, 'type'>): Promise<State>;
    deleteResource?(props: Omit<DeleteProps, 'type'>): Promise<void>;
    getData?(props: Omit<GetDataProps, 'type'>): Promise<State>;
}>;
declare const createCustomProvider: (providerId: string, resourceProviders: Record<string, CustomResourceProvider>) => Provider;

export { App, AppError, type Config, type CreateProps, type CustomResourceProvider, type DataSource, type DataSourceFunction, type DataSourceMeta, type DeleteProps, DynamoLockBackend, FileLockBackend, FileStateBackend, Future, type GetDataProps, type GetProps, Group, type Input, type LockBackend, MemoryLockBackend, MemoryStateBackend, type Meta, type Node, type OptionalInput, type OptionalOutput, Output, type ProcedureOptions, type Provider, type Resource, ResourceAlreadyExists, type ResourceClass, type ResourceConfig, ResourceError, type ResourceMeta, ResourceNotFound, S3StateBackend, Stack, type State, type StateBackend, type Tag, type URN, type UpdateProps, WorkSpace, type WorkSpaceOptions, createCustomProvider, createCustomResourceClass, createDebugger, createMeta, deferredOutput, enableDebug, findInputDeps, getMeta, isDataSource, isNode, isResource, nodeMetaSymbol, output, resolveInputs };

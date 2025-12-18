import { Provider, State as State$1, GetProps, CreateProps, UpdateProps, DeleteProps, GetDataProps } from '@terraforge/core';

type Version = `${number}.${number}.${number}` | 'latest';

type TerraformProviderConfig = {
    id?: string;
    location?: string;
};
type InstallProps = {
    location?: string;
};
declare const createTerraformAPI: <T>(props: {
    namespace: string;
    provider: {
        org: string;
        type: string;
        version: Version;
    };
}) => T;

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
} | {
    type: 'object' | 'array-object';
    properties: Record<string, Property>;
} | {
    type: 'unknown';
});

declare const generateTypes: (providers: Record<string, Property>, resources: Record<string, Property>, dataSources: Record<string, Property>) => string;

type State = Record<string, unknown>;
type Plugin = Readonly<{
    schema: () => {
        provider: Property;
        resources: Record<string, Property>;
        dataSources: Record<string, Property>;
    };
    stop: () => Promise<void>;
    configure: (config: State) => Promise<void>;
    readResource: (type: string, state: State) => Promise<State>;
    readDataSource: (type: string, state: State) => Promise<State>;
    validateResource: (type: string, state: State) => Promise<void>;
    planResourceChange: (type: string, priorState: State | null, proposedNewState: State | null) => Promise<{
        requiresReplace: Array<string | number>[];
        plannedState: State;
    }>;
    applyResourceChange: (type: string, priorState: State | null, proposedNewState: State | null) => Promise<State>;
}>;

declare class TerraformProvider implements Provider {
    private type;
    private id;
    private createPlugin;
    private config;
    private configured?;
    private plugin?;
    constructor(type: string, id: string, createPlugin: () => Promise<Plugin>, config: State$1);
    private configure;
    private prepare;
    destroy(): Promise<void>;
    ownResource(id: string): boolean;
    getResource({ type, state }: GetProps): Promise<{
        version: number;
        state: State;
    }>;
    createResource({ type, state }: CreateProps): Promise<{
        version: number;
        state: State;
    }>;
    updateResource({ type, priorState, proposedState }: UpdateProps): Promise<{
        version: number;
        state: State;
    }>;
    deleteResource({ type, state }: DeleteProps): Promise<void>;
    getData({ type, state }: GetDataProps): Promise<{
        state: State;
    }>;
}

export { type InstallProps, TerraformProvider, type TerraformProviderConfig, createTerraformAPI, generateTypes };

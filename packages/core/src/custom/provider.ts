import { State } from '../meta'
import {
	CreateProps,
	DeleteProps,
	GetDataProps,
	GetProps,
	PlanProps,
	Provider,
	RefreshResourceProps,
	RefreshResourceResult,
	UpdateProps,
} from '../provider'

export type CustomResourceProvider = Partial<{
	getResource?(props: Omit<GetProps, 'type'>): Promise<State>
	updateResource?(props: Omit<UpdateProps, 'type'>): Promise<State>
	createResource?(props: Omit<CreateProps, 'type'>): Promise<State>
	deleteResource?(props: Omit<DeleteProps, 'type'>): Promise<void>
	getData?(props: Omit<GetDataProps, 'type'>): Promise<State>
	planResourceChange?(props: Omit<PlanProps, 'type'>): Promise<{
		state: State
		requiresReplacement: boolean
	}>
	refreshResource?(props: Omit<RefreshResourceProps, 'type'>): Promise<RefreshResourceResult<State> | undefined>
}>

export const createCustomProvider = (
	providerId: string,
	resourceProviders: Record<string, CustomResourceProvider>
): Provider => {
	const version = 1
	const hasRefreshResource = Object.values(resourceProviders).some(provider => !!provider.refreshResource)

	const getProvider = (type: string) => {
		const provider = resourceProviders[type]
		if (!provider) {
			throw new Error(`The "${providerId}" provider doesn't support the "${type}" resource type.`)
		}

		return provider
	}

	const provider: Provider = {
		ownResource(id) {
			return id === `custom:${providerId}`
		},
		async getResource({ type, ...props }) {
			const provider = getProvider(type)

			if (!provider.getResource) {
				return {
					version,
					state: props.state,
				}
			}

			return {
				version,
				state: await provider.getResource(props),
			}
		},
		async createResource({ type, ...props }) {
			const provider = getProvider(type)

			if (!provider.createResource) {
				return {
					version,
					state: props.state,
				}
			}

			return {
				version,
				state: await provider.createResource(props),
			}
		},
		async updateResource({ type, ...props }) {
			const provider = getProvider(type)

			if (!provider.updateResource) {
				return {
					version,
					state: props.proposedState,
				}
			}

			return {
				version,
				state: await provider.updateResource(props),
			}
		},
		async deleteResource({ type, ...props }) {
			await getProvider(type).deleteResource?.(props)
		},
		async planResourceChange({ type, ...props }) {
			const provider = getProvider(type)

			if (!provider.planResourceChange) {
				return {
					version,
					state: props.proposedState,
					requiresReplacement: false,
				}
			}

			const result = await provider.planResourceChange(props)

			return {
				version,
				...result,
			}
		},
		async getData({ type, ...props }) {
			return {
				version,
				state: (await getProvider(type).getData?.(props)) ?? {},
			}
		},
	}

	if (hasRefreshResource) {
		provider.refreshResource = async ({ type, ...props }) => {
			return await getProvider(type).refreshResource?.(props)
		}
	}

	return provider
}

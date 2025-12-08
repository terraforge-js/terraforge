
import { createTerraformAPI } from '@terraforge/terraform'
import { root } from './types.ts'

export const aws = createTerraformAPI<typeof root.aws>({
	namespace: 'aws',
	provider: { org: 'hashicorp', type: 'aws', version: '6.25.0' },
}) as typeof root.aws

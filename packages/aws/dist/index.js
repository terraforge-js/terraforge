
import { createTerraformProxy } from '@terraforge/terraform'

export const aws = createTerraformProxy({
	namespace: 'aws',
	provider: { org: 'hashicorp', type: 'aws', version: '6.27.0' },
})

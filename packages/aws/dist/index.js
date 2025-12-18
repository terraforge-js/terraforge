
import { createTerraformAPI } from '@terraforge/terraform'

export const aws = createTerraformAPI({
	namespace: 'aws',
	provider: { org: 'hashicorp', type: 'aws', version: '6.27.0' },
})

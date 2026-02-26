
import { createTerraformProxy } from '@terraforge/terraform'

export const cloudflare = createTerraformProxy({
	namespace: 'cloudflare',
	provider: { org: 'cloudflare', type: 'cloudflare', version: '5.17.0' },
})

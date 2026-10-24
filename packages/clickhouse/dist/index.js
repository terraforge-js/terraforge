
import { createTerraformProxy } from '@terraforge/terraform'

export const clickhouse = createTerraformProxy({
	namespace: 'clickhouse',
	provider: { org: 'ClickHouse', type: 'clickhouse', version: '3.41.0' },
})

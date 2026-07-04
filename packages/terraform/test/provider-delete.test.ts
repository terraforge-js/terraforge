import { ResourceNotFound } from '@terraforge/core'
import { TerraformProvider } from '../src'
import { Plugin } from '../src/plugin/version/type.ts'

describe('TerraformProvider deleteResource', () => {
	const deleteError = new Error('NoSuchBucket: The specified bucket does not exist')

	const createPlugin = (readResource: Plugin['readResource']): Plugin => ({
		schema() {
			return {
				provider: {
					type: 'object',
					properties: {},
				},
				resources: {
					aws_s3_bucket: {
						type: 'object',
						properties: {
							bucket: {
								type: 'string',
							},
						},
					},
				},
				dataSources: {},
			}
		},
		async stop() {},
		async configure() {},
		readResource,
		async readDataSource() {
			return {}
		},
		async validateResource() {},
		async planResourceChange() {
			return {
				requiresReplace: [],
				plannedState: {},
			}
		},
		async applyResourceChange() {
			throw deleteError
		},
	})

	it('should throw ResourceNotFound when the resource no longer exists', async () => {
		const plugin = createPlugin(async () => null as never)
		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.deleteResource({
				type: 'aws_s3_bucket',
				state: { bucket: 'example' },
			})
		).rejects.toBeInstanceOf(ResourceNotFound)
	})

	it('should rethrow the original error when the resource still exists', async () => {
		const plugin = createPlugin(async () => ({ bucket: 'example' }))
		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.deleteResource({
				type: 'aws_s3_bucket',
				state: { bucket: 'example' },
			})
		).rejects.toBe(deleteError)
	})

	it('should rethrow the original error when the existence probe fails', async () => {
		const plugin = createPlugin(async () => {
			throw new Error('probe failed')
		})
		const provider = new TerraformProvider('aws', 'test', async () => plugin, {})

		await expect(
			provider.deleteResource({
				type: 'aws_s3_bucket',
				state: { bucket: 'example' },
			})
		).rejects.toBe(deleteError)
	})
})

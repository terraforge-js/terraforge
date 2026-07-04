import jszip from 'jszip'
import { createHash } from 'node:crypto'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deletePlugin, downloadPlugin, isPluginInstalled } from '../src/plugin/download'

describe('download plugin', () => {
	const originalFetch = globalThis.fetch

	let dir: string
	let zipBuffer: Buffer
	let shasum: string

	const stubFetch = (overrides: { shasum?: string; downloadStatus?: number }) => {
		globalThis.fetch = (async (url: string | URL) => {
			const href = url.toString()

			if (href.includes('/download/')) {
				return Response.json({
					download_url: 'https://releases.example.com/provider.zip',
					shasum: overrides.shasum ?? shasum,
					protocols: ['6.0'],
				})
			}

			if (href.includes('releases.example.com')) {
				if (overrides.downloadStatus) {
					return new Response('not found', { status: overrides.downloadStatus })
				}

				return new Response(new Uint8Array(zipBuffer))
			}

			throw new Error(`Unexpected fetch: ${href}`)
		}) as typeof fetch
	}

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'terraforge-download-'))

		const zip = new jszip()
		zip.file('terraform-provider-example_v1.0.0', '#!/bin/sh\nexit 0\n')
		zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
		shasum = createHash('sha256').update(zipBuffer).digest('hex')
	})

	afterAll(async () => {
		globalThis.fetch = originalFetch
		await rm(dir, { recursive: true, force: true })
	})

	it('should verify the checksum and install atomically', async () => {
		stubFetch({})

		const { file } = await downloadPlugin({
			location: dir,
			org: 'example',
			type: 'example',
			version: '1.0.0',
		})

		expect(await readFile(file, 'utf8')).toContain('exit 0')

		const files = await readdir(dir)
		expect(files.filter(name => name.endsWith('.tmp'))).toEqual([])
	})

	it('should reject a checksum mismatch without installing', async () => {
		stubFetch({ shasum: 'deadbeef' })

		await expect(
			downloadPlugin({
				location: dir,
				org: 'example',
				type: 'mismatch',
				version: '1.0.0',
			})
		).rejects.toThrow('checksum mismatch')

		const files = await readdir(dir)
		expect(files.filter(name => name.includes('mismatch'))).toEqual([])
	})

	it('isPluginInstalled and deletePlugin should round trip', async () => {
		stubFetch({})

		const props = {
			location: dir,
			org: 'example',
			type: 'roundtrip',
			version: '1.0.0',
		} as const

		expect(await isPluginInstalled(props)).toBe(false)

		await downloadPlugin(props)

		expect(await isPluginInstalled(props)).toBe(true)

		await deletePlugin(props)

		expect(await isPluginInstalled(props)).toBe(false)
	})

	it('should reject a failed download with a clear error', async () => {
		stubFetch({ downloadStatus: 404 })

		await expect(
			downloadPlugin({
				location: dir,
				org: 'example',
				type: 'missing',
				version: '1.0.0',
			})
		).rejects.toThrow('Failed to download the provider: 404')
	})
})

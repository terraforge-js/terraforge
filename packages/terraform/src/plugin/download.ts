import { createDebugger } from '@terraforge/core'
import jszip from 'jszip'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getProviderDownloadUrl, getProviderVersions, type Version } from './registry.ts'

const exists = async (file: string) => {
	try {
		await stat(file)
	} catch (error) {
		return false
	}

	return true
}

const debug = createDebugger('Downloader')

export type DownloadPluginProps = {
	location?: string
	org: string
	type: string
	version: Version
}

const installPath = join(homedir(), '.terraforge', 'plugins')

export const downloadPlugin = async (props: DownloadPluginProps) => {
	if (props.version === 'latest') {
		const { latest } = await getProviderVersions(props.org, props.type)
		props.version = latest
	}

	const dir = props.location ?? installPath
	const file = join(dir, `${props.org}-${props.type}-${props.version}`)

	const exist = await exists(file)

	if (!exist) {
		debug(props.type, 'downloading...')
		const info = await getProviderDownloadUrl(props.org, props.type, props.version)
		const res = await fetch(info.url)
		const buf = await res.bytes()

		const zip = await jszip.loadAsync(buf)
		const zipped = zip.filter(file => file.startsWith('terraform-provider')).at(0)

		if (!zipped) {
			throw new Error(`Can't find the provider inside the downloaded zip file.`)
		}

		const binary = await zipped.async('nodebuffer')

		debug(props.type, 'done')

		await mkdir(dir, { recursive: true })
		await writeFile(file, binary, {
			mode: 0o775,
		})
	} else {
		debug(props.type, 'already downloaded')
	}

	return {
		file,
		version: props.version,
	}
}

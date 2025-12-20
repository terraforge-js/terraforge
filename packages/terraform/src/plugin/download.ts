import { createDebugger } from '@terraforge/core'
import jszip from 'jszip'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
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

const getInstallPath = (props: DownloadPluginProps) => {
	const dir = props.location ?? installPath
	const file = join(dir, `${props.org}-${props.type}-${props.version}`)

	return file
}

export const isPluginInstalled = (props: DownloadPluginProps) => {
	return exists(getInstallPath(props))
}

export const deletePlugin = async (props: DownloadPluginProps) => {
	const file = getInstallPath(props)
	const isAlreadyInstalled = await isPluginInstalled(props)

	if (isAlreadyInstalled) {
		debug(props.type, 'deleting...')
		await rm(file)
		debug(props.type, 'deleted')
	} else {
		debug(props.type, 'not installed')
	}
}

export const downloadPlugin = async (props: DownloadPluginProps) => {
	if (props.version === 'latest') {
		const { latest } = await getProviderVersions(props.org, props.type)
		props.version = latest
	}

	const file = getInstallPath(props)
	const isAlreadyInstalled = await isPluginInstalled(props)

	if (!isAlreadyInstalled) {
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

		await mkdir(dirname(file), { recursive: true })
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

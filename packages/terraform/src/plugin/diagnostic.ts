type Diagnostic = {
	severity: 0 | 1 | 2
	summary: string
	detail?: string
	attribute?: AttributePath
}

type AttributePath = {
	steps: Step[]
}

type Step = {
	attributeName: string
	elementKeyString?: string
	elementKeyInt?: number
}

type Response = {
	diagnostics: Diagnostic[]
}

type DiagnosticEntry = {
	readonly severity: 'error' | 'warning'
	readonly summary: string
	readonly detail?: string
	readonly path?: Array<string | number>
}

class DiagnosticsError extends Error {
	constructor(readonly diagnostics: DiagnosticEntry[]) {
		super(formatDiagnosticErrorMessage(diagnostics))
	}
}

const formatDiagnosticErrorMessage = (diagnostics: DiagnosticEntry[]): string => {
	if (diagnostics.length === 0) {
		return 'Unknown diagnostic error'
	}

	const diagnostic = diagnostics[0]!

	if (diagnostic.detail) {
		return `${diagnostic.summary}\n\n${diagnostic.detail}`
	}

	return diagnostic.summary
}

export const throwDiagnosticError = (response: Response) => {
	const diagnostics: DiagnosticEntry[] = response.diagnostics.map(item => ({
		severity: item.severity === 1 ? 'error' : 'warning',
		summary: item.summary,
		detail: item.detail,
		path: item.attribute?.steps.map(step => step.attributeName),
	}))

	return new DiagnosticsError(diagnostics)
}

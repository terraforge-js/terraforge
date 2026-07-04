type Diagnostic = {
	severity: 0 | 1 | 2
	summary: string
	detail?: string
	attribute?: AttributePath
}

type AttributePath = {
	steps: Step[]
}

// A proto oneof — exactly one of the fields is set.
type Step = {
	attributeName?: string
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

// Severity: 0 = invalid, 1 = error, 2 = warning. Anything that isn't
// explicitly a warning is treated as an error.
export const hasErrorDiagnostic = (response: Response) => {
	return response.diagnostics?.some(item => item.severity !== 2) ?? false
}

export const throwDiagnosticError = (response: Response) => {
	const diagnostics: DiagnosticEntry[] = response.diagnostics.map(item => ({
		severity: item.severity === 2 ? 'warning' : 'error',
		summary: item.summary,
		detail: item.detail,
		path: item.attribute?.steps.map(step => {
			if (step.attributeName !== undefined) {
				return step.attributeName
			}

			if (step.elementKeyString !== undefined) {
				return step.elementKeyString
			}

			return Number(step.elementKeyInt)
		}),
	}))

	return new DiagnosticsError(diagnostics)
}

import { hasErrorDiagnostic, throwDiagnosticError } from '../src/plugin/diagnostic'

describe('diagnostic', () => {
	it('should not flag a response without diagnostics', () => {
		expect(hasErrorDiagnostic({} as never)).toBe(false)
		expect(hasErrorDiagnostic({ diagnostics: [] })).toBe(false)
	})

	it('should not flag warnings', () => {
		expect(
			hasErrorDiagnostic({
				diagnostics: [{ severity: 2, summary: 'Deprecated attribute' }],
			})
		).toBe(false)
	})

	it('should flag errors and invalid severities', () => {
		expect(
			hasErrorDiagnostic({
				diagnostics: [
					{ severity: 2, summary: 'Deprecated attribute' },
					{ severity: 1, summary: 'Invalid config' },
				],
			})
		).toBe(true)

		expect(
			hasErrorDiagnostic({
				diagnostics: [{ severity: 0, summary: 'Unspecified' }],
			})
		).toBe(true)
	})

	it('should convert element key steps in attribute paths', () => {
		const error = throwDiagnosticError({
			diagnostics: [
				{
					severity: 1,
					summary: 'Invalid value',
					attribute: {
						steps: [{ attributeName: 'rules' }, { elementKeyInt: 3 }, { attributeName: 'value' }],
					},
				},
				{
					severity: 1,
					summary: 'Invalid entry',
					attribute: {
						steps: [{ attributeName: 'tags' }, { elementKeyString: 'env' }],
					},
				},
			],
		})

		expect(error.diagnostics[0]?.path).toEqual(['rules', 3, 'value'])
		expect(error.diagnostics[1]?.path).toEqual(['tags', 'env'])
	})

	it('should only label explicit warnings as warnings', () => {
		const error = throwDiagnosticError({
			diagnostics: [
				{ severity: 0, summary: 'Unspecified' },
				{ severity: 1, summary: 'Invalid config' },
				{ severity: 2, summary: 'Deprecated attribute' },
			],
		})

		expect(error.diagnostics.map(d => d.severity)).toEqual(['error', 'error', 'warning'])
	})
})

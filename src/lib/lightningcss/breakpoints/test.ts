import { describe, it, expect } from 'vitest'
import { breakpoints } from './index.js'

describe('breakpoints function', () => {
	const config = {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280
	}

	const media_query = breakpoints(config).MediaQuery

	it('should generate media query for custom breakpoints', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--from-md' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 48em)' })
	})

	it('should handle multiple conditions', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--from-md' } }, { value: { name: '--until-lg' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 48em) and (max-width: 63.9375em)' })
	})

	it('should generate a range for --only-', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--only-md' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 48em) and (max-width: 63.9375em)' })
	})

	it('should leave --only- open-ended on the largest breakpoint', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--only-xl' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 80em)' })
	})

	it('should parenthesise --only- when combined with other conditions', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--only-md' } }, { value: { name: '--from-sm' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '((min-width: 48em) and (max-width: 63.9375em)) and (min-width: 40em)' })
	})

	it('should throw on an unknown prefix, showing the correct syntax', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--to-lg' } }]
			}
		}
		expect(() => media_query(input as never)).toThrow(
			'[kitto] unknown breakpoint query (--to-lg); use (--from-lg) for min-width, (--until-lg) for max-width or (--only-lg) for just that range'
		)
	})

	it('should throw on a missing prefix, showing the correct syntax', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--lg' } }]
			}
		}
		expect(() => media_query(input as never)).toThrow(
			'use (--from-lg) for min-width, (--until-lg) for max-width or (--only-lg) for just that range'
		)
	})

	it('should return original media if no custom breakpoints matched', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: '--unknown' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toBe(input)
	})

	it('should return original media if condition name does not start with --', () => {
		const input = {
			condition: {
				operator: 'and',
				conditions: [{ value: { name: 'min-width' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toBe(input)
	})

	it('should handle media queries with value instead of conditions', () => {
		const input = {
			condition: {
				operator: 'and',
				value: { name: '--from-xl' }
			}
		} as const
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 80em)' })
	})
})

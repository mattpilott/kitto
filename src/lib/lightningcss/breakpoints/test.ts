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
				conditions: [{ value: { name: '--from-md' } }, { value: { name: '--to-lg' } }]
			}
		}
		const result = media_query(input as never)
		expect(result).toEqual({ raw: '(min-width: 48em) and (max-width: 63.9375em)' })
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

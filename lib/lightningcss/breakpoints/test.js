import { describe, it, expect } from 'vitest'
import { breakpoints } from './index.js'

describe('breakpoints function', () => {
	const breakpointsConfig = {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280
	}

	it('should generate media query for custom breakpoints', () => {
		const breakpointsFunc = breakpoints(breakpointsConfig).Rule.media
		const input = {
			value: {
				query: {
					mediaQueries: [
						{
							condition: {
								operator: 'and',
								conditions: [{ value: { name: '--from-md' } }]
							}
						}
					]
				}
			}
		}
		const result = breakpointsFunc(input)
		expect(result).toEqual({
			value: {
				query: {
					mediaQueries: [{ raw: '(min-width: 48em)' }]
				}
			}
		})
	})

	it('should handle multiple conditions', () => {
		const breakpointsFunc = breakpoints(breakpointsConfig).Rule.media
		const input = {
			value: {
				query: {
					mediaQueries: [
						{
							condition: {
								operator: 'and',
								conditions: [{ value: { name: '--from-md' } }, { value: { name: '--to-lg' } }]
							}
						}
					]
				}
			}
		}
		const result = breakpointsFunc(input)
		expect(result).toEqual({
			value: {
				query: {
					mediaQueries: [{ raw: '(min-width: 48em) and (max-width: 64em)' }]
				}
			}
		})
	})

	it('should return original media if no custom breakpoints matched', () => {
		const breakpointsFunc = breakpoints(breakpointsConfig).Rule.media
		const input = {
			value: {
				query: {
					mediaQueries: [
						{
							condition: {
								operator: 'and',
								conditions: [{ value: { name: '--unknown' } }]
							}
						}
					]
				}
			}
		}
		const result = breakpointsFunc(input)
		expect(result).toEqual(input)
	})

	it('should return original media if condition name does not start with --', () => {
		const breakpointsFunc = breakpoints(breakpointsConfig).Rule.media
		const input = {
			value: {
				query: {
					mediaQueries: [
						{
							condition: {
								operator: 'and',
								conditions: [{ value: { name: 'min-width' } }]
							}
						}
					]
				}
			}
		}
		const result = breakpointsFunc(input)
		expect(result).toEqual(input)
	})

	it('should handle media queries with value instead of conditions', () => {
		const breakpointsFunc = breakpoints(breakpointsConfig).Rule.media
		const input = {
			value: {
				query: {
					mediaQueries: [
						{
							condition: {
								operator: 'and',
								value: { name: '--from-xl' }
							}
						}
					]
				}
			}
		}
		const result = breakpointsFunc(input)
		expect(result).toEqual({
			value: {
				query: {
					mediaQueries: [{ raw: '(min-width: 80em)' }]
				}
			}
		})
	})
})

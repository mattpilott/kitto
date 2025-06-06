import { describe, it, expect } from 'vitest'
import { to_tristate } from './index.js'

describe('to_tristate', () => {
	it('should return 0 when the value is undefined', () => {
		const result = to_tristate(undefined)
		expect(result).toBe(0)
	})

	it('should return -1 when the value is false', () => {
		const result = to_tristate(false)
		expect(result).toBe(-1)
	})

	it('should return 1 when the value is true', () => {
		const result = to_tristate(true)
		expect(result).toBe(1)
	})
})

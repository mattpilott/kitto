import { describe, it, expect } from 'vitest'
import { toTristate } from './index.js' // Adjust the path as necessary

describe('toTristate', () => {
	it('should return 0 when the value is undefined', () => {
		const result = toTristate(undefined)
		expect(result).toBe(0)
	})

	it('should return -1 when the value is false', () => {
		const result = toTristate(false)
		expect(result).toBe(-1)
	})

	it('should return 1 when the value is true', () => {
		const result = toTristate(true)
		expect(result).toBe(1)
	})
})

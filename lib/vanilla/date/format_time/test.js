import { describe, it, expect } from 'vitest'
import { formatTime } from './index.js' // Adjust the path as necessary

describe('formatTime', () => {
	it('should correctly format time for less than an hour', () => {
		const result = formatTime(45) // 45 minutes
		expect(result).toBe('0h 45m')
	})

	it('should correctly format time for exactly one hour', () => {
		const result = formatTime(60) // 60 minutes
		expect(result).toBe('1h 0m')
	})

	it('should correctly format time for more than an hour', () => {
		const result = formatTime(135) // 2 hours and 15 minutes
		expect(result).toBe('2h 15m')
	})

	it('should correctly format time for a large number of minutes', () => {
		const result = formatTime(1445) // 24 hours and 5 minutes
		expect(result).toBe('24h 5m')
	})

	it('should correctly format time for zero minutes', () => {
		const result = formatTime(0) // 0 minutes
		expect(result).toBe('0h 0m')
	})

	it('should correctly format time for less than a minute', () => {
		const result = formatTime(5) // 5 minutes
		expect(result).toBe('0h 5m')
	})

	it('should correctly format time for exactly multiple hours', () => {
		const result = formatTime(360) // 6 hours
		expect(result).toBe('6h 0m')
	})
})
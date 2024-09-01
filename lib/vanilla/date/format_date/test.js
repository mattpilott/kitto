import { describe, it, expect } from 'vitest'
import { formatDate } from './index.js' // Adjust the path as necessary

describe('formatDate', () => {
	it('should format date using YYYY', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{YYYY}', date)
		expect(result).toBe('2023')
	})

	it('should format date using YY', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{YY}', date)
		expect(result).toBe('23')
	})

	it('should format date using MMMM and D', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{MMMM} {D}', date)
		expect(result).toBe('August 29')
	})

	it('should format date using Do and dddd', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{Do} {dddd}', date)
		expect(result).toBe('29th Tuesday')
	})

	it('should format date using HH:mm:ss', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{HH}:{mm}:{ss}', date)
		expect(result).toBe('12:34:56')
	})

	it('should format date using h:mm A', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{h}:{mm} {A}', date)
		expect(result).toBe('12:34 PM')
	})

	it('should format date using invalid format', () => {
		const date = new Date('2023-08-29T12:34:56')
		expect(() => formatDate('{INVALID}', date)).toThrow(
			'{INVALID} is an invalid format. Valid formats are: YY, YYYY, M, MM, MMM, MMMM, D, DD, d, dd, ddd, dddd, Do, H, HH, h, hh, m, mm, s, ss, SSS, A, a'
		)
	})

	it('should format date using multiple formats', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = formatDate('{dddd}, {MMMM} {Do}, {YYYY}', date)
		expect(result).toBe('Tuesday, August 29th, 2023')
	})

	it('should format the current date if no date is provided', () => {
		const result = formatDate('{YYYY}')
		const currentYear = new Date().getFullYear()
		expect(result).toBe(String(currentYear))
	})
})

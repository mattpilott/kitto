import { describe, it, expect } from 'vitest'
import { format_date } from './index.js' // Adjust the path as necessary

describe('format_date', () => {
	it('should format date using YYYY', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{YYYY}', date)
		expect(result).toBe('2023')
	})

	it('should format date using YY', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{YY}', date)
		expect(result).toBe('23')
	})

	it('should format date using MMMM and D', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{MMMM} {D}', date)
		expect(result).toBe('August 29')
	})

	it('should format date using Do and dddd', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{Do} {dddd}', date)
		expect(result).toBe('29th Tuesday')
	})

	it('should format date using HH:mm:ss', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{HH}:{mm}:{ss}', date)
		expect(result).toBe('12:34:56')
	})

	it('should format date using h:mm A', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{h}:{mm} {A}', date)
		expect(result).toBe('12:34 PM')
	})

	it('should format date using invalid format', () => {
		const date = new Date('2023-08-29T12:34:56')
		expect(() => format_date('{INVALID}', date)).toThrow(
			'{INVALID} is an invalid format. Valid formats are: YY, YYYY, M, MM, MMM, MMMM, D, DD, d, dd, ddd, dddd, Do, H, HH, h, hh, m, mm, s, ss, SSS, A, a'
		)
	})

	it('should format date using multiple formats', () => {
		const date = new Date('2023-08-29T12:34:56')
		const result = format_date('{dddd}, {MMMM} {Do}, {YYYY}', date)
		expect(result).toBe('Tuesday, August 29th, 2023')
	})

	it('should format the current date if no date is provided', () => {
		const result = format_date('{YYYY}')
		const current_year = new Date().getFullYear()
		expect(result).toBe(String(current_year))
	})
})

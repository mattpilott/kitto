import { describe, it, expect, vi } from 'vitest'
import { formatElapse } from './index.js'

vi.mock('../format_date/index.js', () => ({
	formatDate: vi.fn((format, date) => {
		if (format === 'Today at {hh}:{mm}') {
			return `Today at ${date.getHours()}:${date.getMinutes()}`
		}
		if (format === 'Yesterday at {hh}:{mm}') {
			return `Yesterday at ${date.getHours()}:${date.getMinutes()}`
		}
		return ''
	})
}))

describe('formatElapse', () => {
	it('should return "now" if the date is within 5 seconds', () => {
		const now = new Date()
		const result = formatElapse(now)
		expect(result).toBe('now')
	})

	it('should return seconds ago if the date is less than 60 seconds ago', () => {
		const now = new Date()
		const date = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
		const result = formatElapse(date)
		expect(result).toBe('30 seconds ago')
	})

	it('should return "about a minute ago" if the date is between 60 and 90 seconds ago', () => {
		const now = new Date()
		const date = new Date(now.getTime() - 75 * 1000) // 75 seconds ago
		const result = formatElapse(date)
		expect(result).toBe('about a minute ago')
	})

	it('should return minutes ago if the date is less than an hour ago', () => {
		const now = new Date()
		const date = new Date(now.getTime() - 45 * 60 * 1000) // 45 minutes ago
		const result = formatElapse(date)
		expect(result).toBe('45 minutes ago')
	})

	it('should return "Today at hh:mm" if the date is today', () => {
		const now = new Date()
		const date = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
		const result = formatElapse(date)
		expect(result).toBe(`Today at ${date.getHours()}:${date.getMinutes()}`)
	})

	it('should return "Yesterday at hh:mm" if the date is yesterday', () => {
		const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000) // Exactly yesterday
		yesterday.setHours(10, 20) // 10:20 yesterday
		const result = formatElapse(yesterday)
		expect(result).toBe('Yesterday at 10:20')
	})

	it('should return null if no date is provided', () => {
		const result = formatElapse()
		expect(result).toBeNull()
	})

	it('should return false for dates older than yesterday', () => {
		const oldDate = new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
		const result = formatElapse(oldDate)
		expect(result).toBe(false)
	})
})

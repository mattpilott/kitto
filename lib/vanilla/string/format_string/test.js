import { describe, it, expect } from 'vitest'
import { formatString } from './index.js' // Adjust the path as necessary

describe('formatString', () => {
	it('should convert a string to sentence case', () => {
		const input = 'this is a test string.'
		const result = formatString(input, false)
		expect(result).toBe('This is a test string.')
	})

	it('should convert a string to title case', () => {
		const input = 'this is a test string.'
		const result = formatString(input, true)
		expect(result).toBe('This is a Test String.')
	})

	it('should handle multiple sentences correctly in sentence case', () => {
		const input = 'this is a test. here is another sentence.'
		const result = formatString(input, false)
		expect(result).toBe('This is a test. Here is another sentence.')
	})

	it('should handle multiple sentences correctly in title case', () => {
		const input = 'this is a test. here is another sentence.'
		const result = formatString(input, true)
		expect(result).toBe('This is a Test. Here is Another Sentence.')
	})

	it('should handle an empty string', () => {
		const input = ''
		const result = formatString(input, false)
		expect(result).toBe('')
	})

	it('should handle a string with new lines and form feeds', () => {
		const input = 'this is a test.\nthis is on a new line.\fthis is after a form feed.'
		const result = formatString(input, false)
		expect(result).toBe('This is a test.\nThis is on a new line.\fThis is after a form feed.')
	})

	it('should handle already formatted sentence case string correctly', () => {
		const input = 'This is already formatted.'
		const result = formatString(input, false)
		expect(result).toBe('This is already formatted.')
	})

	it('should handle already formatted title case string correctly', () => {
		const input = 'This Is Already Formatted.'
		const result = formatString(input, true)
		expect(result).toBe('This is Already Formatted.')
	})
})
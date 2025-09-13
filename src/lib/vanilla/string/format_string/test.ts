import { describe, it, expect } from 'vitest'
import { format_string } from './index.js'

describe('format_string', () => {
	it('should convert a string to sentence case', () => {
		const input = 'this is a test string.'
		const result = format_string(input, 'sentence')
		expect(result).toBe('This is a test string.')
	})

	it('should convert a string to title case', () => {
		const input = 'this is a test string.'
		const result = format_string(input, 'title')
		expect(result).toBe('This is a Test String.')
	})

	it('should convert a string to slug format', () => {
		const input = 'This is a Test String!'
		const result = format_string(input, 'slug')
		expect(result).toBe('this-is-a-test-string')
	})

	it('should handle multiple sentences correctly in sentence case', () => {
		const input = 'this is a test. here is another sentence.'
		const result = format_string(input, 'sentence')
		expect(result).toBe('This is a test. Here is another sentence.')
	})

	it('should handle multiple sentences correctly in title case', () => {
		const input = 'this is a test. here is another sentence.'
		const result = format_string(input, 'title')
		expect(result).toBe('This is a Test. Here is Another Sentence.')
	})

	it('should handle multiple sentences correctly in slug format', () => {
		const input = 'This is a test! Here is another sentence?'
		const result = format_string(input, 'slug')
		expect(result).toBe('this-is-a-test-here-is-another-sentence')
	})

	it('should handle an empty string', () => {
		const input = ''
		const result = format_string(input, 'sentence')
		expect(result).toBe('')
	})

	it('should handle a string with new lines and form feeds in sentence case', () => {
		const input = 'this is a test.\nthis is on a new line.\fthis is after a form feed.'
		const result = format_string(input, 'sentence')
		expect(result).toBe('This is a test.\nThis is on a new line.\fThis is after a form feed.')
	})

	it('should handle a string with new lines and form feeds in slug format', () => {
		const input = 'This is a test!\nThis is on a new line.\fThis is after a form feed?'
		const result = format_string(input, 'slug')
		expect(result).toBe('this-is-a-test-this-is-on-a-new-line-this-is-after-a-form-feed')
	})

	it('should handle already formatted sentence case string correctly', () => {
		const input = 'This is already formatted.'
		const result = format_string(input, 'sentence')
		expect(result).toBe('This is already formatted.')
	})

	it('should handle already formatted title case string correctly', () => {
		const input = 'This Is Already Formatted.'
		const result = format_string(input, 'title')
		expect(result).toBe('This is Already Formatted.')
	})

	it('should handle special characters in slug format', () => {
		const input = 'Hello, World! How are you? @#$%^&*()'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-how-are-you')
	})

	it('should handle multiple consecutive spaces and dashes in slug format', () => {
		const input = 'Hello    World---Test'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-test')
	})

	it('should handle underscores in slug format', () => {
		const input = 'Hello_World_Test'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-test')
	})

	it('should handle mixed underscores and spaces in slug format', () => {
		const input = 'Hello_World Test_String'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-test-string')
	})

	it('should handle multiple consecutive underscores in slug format', () => {
		const input = 'Hello___World____Test'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-test')
	})

	it('should handle mixed special characters, underscores, and spaces in slug format', () => {
		const input = 'Hello_World! Test@String#123'
		const result = format_string(input, 'slug')
		expect(result).toBe('hello-world-test-string-123')
	})

	it('should default to sentence case when no format is specified', () => {
		const input = 'this is a test string.'
		const result = format_string(input)
		expect(result).toBe('This is a test string.')
	})
})

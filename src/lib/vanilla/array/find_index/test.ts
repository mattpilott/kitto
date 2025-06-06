import { describe, it, expect } from 'vitest'
import { find_index } from './index.js'

// Define common test data at the top
const data = [
	{ id: 1, name: 'John', age: 25 },
	{ id: 2, name: 'Jane', age: 30 },
	{ id: 3, name: 'Joe', age: 35 },
	{ id: 4, name: 'Jane' } // This object has the 'name' key with value 'Jane'
]

describe('find_index', () => {
	it('should return the correct index when a matching key-value pair is found', () => {
		const result_index = find_index(data, 'name', 'Jane')
		expect(result_index).toBe(1)
	})

	it('should return -1 when no matching key-value pair is found', () => {
		const result_index = find_index(data, 'name', 'Jack')
		expect(result_index).toBe(-1)
	})

	it('should handle an empty array', () => {
		const result_index = find_index([], 'name', 'Jane' as never)
		expect(result_index).toBe(-1)
	})

	it('should handle different data types for the value', () => {
		const result_index_string = find_index(data, 'name', 'Joe')
		const result_index_number = find_index(data, 'age', 30)

		expect(result_index_string).toBe(2)
		expect(result_index_number).toBe(1)
	})

	it('should return the index of the first match when multiple objects match the key-value pair', () => {
		const result_index = find_index(data, 'name', 'Jane')
		expect(result_index).toBe(1)
	})

	it('should handle objects with missing keys gracefully', () => {
		const result_index = find_index(data, 'name', 'Joe')
		expect(result_index).toBe(2)
	})
})

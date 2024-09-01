import { describe, it, expect } from 'vitest'
import { findIndex } from './index.js' // Adjust the path as necessary

// Define common test data at the top
const data = [
	{ id: 1, name: 'John', age: 25 },
	{ id: 2, name: 'Jane', age: 30 },
	{ id: 3, name: 'Joe', age: 35 },
	{ id: 4, name: 'Jane' } // This object has the 'name' key with value 'Jane'
]

describe('findIndex', () => {
	it('should return the correct index when a matching key-value pair is found', () => {
		const resultIndex = findIndex(data, 'name', 'Jane')
		expect(resultIndex).toBe(1)
	})

	it('should return -1 when no matching key-value pair is found', () => {
		const resultIndex = findIndex(data, 'name', 'Jack')
		expect(resultIndex).toBe(-1)
	})

	it('should handle an empty array', () => {
		const resultIndex = findIndex([], 'name', 'Jane')
		expect(resultIndex).toBe(-1)
	})

	it('should handle different data types for the value', () => {
		const resultIndexString = findIndex(data, 'name', 'Joe')
		const resultIndexNumber = findIndex(data, 'age', 30)

		expect(resultIndexString).toBe(2)
		expect(resultIndexNumber).toBe(1)
	})

	it('should return the index of the first match when multiple objects match the key-value pair', () => {
		const resultIndex = findIndex(data, 'name', 'Jane')
		expect(resultIndex).toBe(1)
	})

	it('should handle objects with missing keys gracefully', () => {
		const resultIndex = findIndex(data, 'name', 'Joe')
		expect(resultIndex).toBe(2)
	})
})

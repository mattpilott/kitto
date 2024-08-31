import { describe, it, expect } from 'vitest'
import { findIndex } from './find_index' // Adjust the import path as necessary

describe('findIndex', () => {
	const data = [
		{
			id: 1,
			name: 'John',
			children: [
				{
					id: 2,
					name: 'Jane',
					details: { key: 'info', value: 'targetValue' }
				},
				{
					id: 3,
					name: 'Joe'
				}
			]
		},
		{
			id: 4,
			name: 'Doe'
		}
	]

	it('should find the index of an object with a direct key-value match', () => {
		const resultIndex = findIndex(data, 'name', 'John')
		expect(resultIndex).toBe(0)
	})

	it('should return -1 if no object matches the key-value pair', () => {
		const resultIndex = findIndex(data, 'name', 'NotExist')
		expect(resultIndex).toBe(-1)
	})

	it('should find the index of an object in nested arrays when recursive is true', () => {
		const resultIndex = findIndex(data, 'value', 'targetValue', true)
		expect(resultIndex).toBe(1)
	})

	it('should return the index of the parent object when returnParent is true', () => {
		const parentResultIndex = findIndex(data, 'value', 'targetValue', true, true)
		expect(parentResultIndex).toBe(0)
	})

	it('should return -1 if no match is found in nested objects with recursive true', () => {
		const resultIndex = findIndex(data, 'key', 'nonExistentKey', true)
		expect(resultIndex).toBe(-1)
	})

	it('should not search recursively if recursive is false', () => {
		const resultIndex = findIndex(data, 'value', 'targetValue', false)
		expect(resultIndex).toBe(-1)
	})

	it('should handle an empty array gracefully', () => {
		const resultIndex = findIndex([], 'name', 'John')
		expect(resultIndex).toBe(-1)
	})

	it('should find the index of a nested object directly if returnParent is false', () => {
		const nestedData = [
			{
				id: 1,
				name: 'Outer',
				child: {
					id: 2,
					name: 'Inner',
					value: 'targetValue'
				}
			}
		]
		const resultIndex = findIndex(nestedData, 'value', 'targetValue', true)
		expect(resultIndex).toBe(0)
	})

	it('should return the parent index for nested objects if returnParent is true', () => {
		const nestedData = [
			{
				id: 1,
				name: 'Outer',
				child: {
					id: 2,
					name: 'Inner',
					value: 'targetValue'
				}
			}
		]
		const parentResultIndex = findIndex(nestedData, 'value', 'targetValue', true, true)
		expect(parentResultIndex).toBe(0)
	})
})

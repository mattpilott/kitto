import { describe, it, expect } from 'vitest'
import { find_object } from './index.js'

describe('find_object', () => {
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

	it('should find an object with a direct key-value match', () => {
		const result = find_object(data, 'name', 'John')
		expect(result).toEqual({ id: 1, name: 'John', children: expect.any(Array) })
	})

	it('should return undefined if no object matches the key-value pair', () => {
		const result = find_object(data, 'name', 'NotExist')
		expect(result).toBeUndefined()
	})

	it('should find an object in nested arrays when recursive is true', () => {
		const result = find_object(data, 'value', 'targetValue', true)
		expect(result).toEqual({ key: 'info', value: 'targetValue' })
	})

	it('should return undefined if no match is found in nested objects with recursive true', () => {
		const result = find_object(data, 'key', 'nonExistentKey', true)
		expect(result).toBeUndefined()
	})

	it('should not search recursively if recursive is false', () => {
		const result = find_object(data, 'value', 'targetValue', false)
		expect(result).toBeUndefined()
	})

	it('should handle empty array gracefully', () => {
		const result = find_object([], 'name', 'John')
		expect(result).toBeUndefined()
	})
})

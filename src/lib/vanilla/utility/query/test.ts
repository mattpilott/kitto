/* Imports */
import { describe, it, expect } from 'vitest'
import { query } from './index.js' // Adjust the path as necessary

/* Setup */
const data = { one: 1, two: 'he.*g', three: ['a', 'b'] }

/* Test */
describe('formatString', () => {
	it('should encode object to string', () => {
		const result = query(data)
		expect(result).toBe('one=1&two=he.*g&three=a&three=b')
	})

	it('should decode string to object', () => {
		const result = query('one=1&two=he.*g&three=a&three=b')
		expect(result).toStrictEqual(data)
	})
})

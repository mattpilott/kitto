/* Imports */
import { bench, describe } from 'vitest'
import { query } from './index.js'

/* Setup */
const data = { one: 1, two: 'he.*g', three: ['a', 'b'] }
const str = 'one=1&two=he.*g&three=a&three=b'

/* Benchmark */
describe('query', () => {
	bench('encode', () => {
		query(data, '?')
	})
	bench('decode', () => {
		query(str)
	})
})

/* Imports */
import { bench } from 'vitest'
import { find_index } from './index.js'

/* Setup */
const arr = [
	{ testA: 1, testB: 2 },
	{ testA: 3, testB: 4 }
]

/* Benchmark */
bench('find_index', () => {
	find_index(arr, 'testA', 1)
})

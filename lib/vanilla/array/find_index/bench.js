/* Imports */
import { bench } from 'vitest'
import { findIndex } from './index.js'

/* Setup */
const arr = [
	{ testA: 1, testB: 2 },
	{ testA: 3, testB: 4 }
]

/* Benchmark */
bench('findIndex', () => findIndex(arr, 'testA', 1))

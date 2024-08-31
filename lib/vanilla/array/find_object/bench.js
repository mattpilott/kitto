/* Imports */
import { bench } from 'vitest'
import findObject from './index.js'

/* Setup */
const arr = [
	{ testA: 1, testB: 2 },
	{ testA: 3, testB: 4 }
]

bench('findObject', () => findObject(arr, 'testA', 1))

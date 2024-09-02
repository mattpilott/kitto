/* Imports */
import { bench } from 'vitest'
import { findObject } from './index.js'

/* Setup */
const arr = () => [
	{ testA: 1, testB: 2 },
	{
		testA: 3,
		testB: {
			testC: 4,
			testD: [{ testE: 5 }, { testE: 6 }]
		}
	}
]

/* Benchmark */
bench('findObject', () => findObject(arr(), 'testA', 1))
bench('findObject recursive', () => findObject(arr(), 'testC', 4, true))
bench('findObject deep recursive', () => findObject(arr(), 'testE', 6, true))

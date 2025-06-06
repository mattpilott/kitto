/* Imports */
import { bench } from 'vitest'
import { find_object } from './index.js'

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
bench('find_object', () => {
	find_object(arr(), 'testA', 1)
})
bench('find_object recursive', () => {
	find_object(arr(), 'testC' as never, 4, true)
})
bench('find_object deep recursive', () => {
	find_object(arr(), 'testE' as never, 6, true)
})

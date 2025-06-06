/* Imports */
import { bench } from 'vitest'
import { format_time } from './index.js'

/* Setup */
const mins = 90

/* Benchmark */
bench('format_time', () => {
	format_time(mins)
})

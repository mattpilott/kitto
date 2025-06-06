/* Imports */
import { bench } from 'vitest'
import { format_elapse } from './index.js'

/* Setup */
const date = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

/* Benchmark */
bench('format_elapse', () => {
	format_elapse(date)
})

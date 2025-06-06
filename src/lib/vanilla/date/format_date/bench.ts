/* Imports */
import { bench, describe } from 'vitest'
import { format_date } from './index.js'
import tinydate from 'tinydate'

/* Setup */
const str = '{YY} {MM} {DD} @ {HH}:{mm}:{ss}'

/* Benchmark */
describe('compare formatDate & tinydate', () => {
	bench('format_date', () => {
		format_date(str)
	})
	bench('tinydate', () => {
		tinydate(str)
	})
})

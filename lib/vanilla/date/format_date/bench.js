/* Imports */
import { bench, describe } from 'vitest'
import { formatDate } from './index.js'
import tinydate from 'tinydate'

/* Setup */
const str = '{YY} {MM} {DD} @ {HH}:{mm}:{ss}'

/* Benchmark */
describe('compare formatDate & tinydate', () => {
	bench('formatDate', () => formatDate(str))
	bench('tinydate', () => tinydate(str))
})

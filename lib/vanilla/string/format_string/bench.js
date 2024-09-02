/* Imports */
import { bench, describe } from 'vitest'
import { formatString } from './index.js'

/* Setup */
const sentence =
	"constantly seek criticism.\fa WELL THOUGHT out critique\nof what you're doing is\nas valuable as gold"
const title = 'elon musk'

/* Benchmark */
describe('formatString', () => {
	bench('sentence', () => formatString(sentence))
	bench('title', () => formatString(title, true))
})

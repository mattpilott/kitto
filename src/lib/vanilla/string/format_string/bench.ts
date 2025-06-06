/* Imports */
import { bench, describe } from 'vitest'
import { format_string } from './index.js'

/* Setup */
const sentence =
	"constantly seek criticism.\fa WELL THOUGHT out critique\nof what you're doing is\nas valuable as gold"
const title = 'elon musk'

/* Benchmark */
describe('format_string', () => {
	bench('sentence', () => {
		format_string(sentence)
	})
	bench('title', () => {
		format_string(title, true)
	})
})

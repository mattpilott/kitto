/* Imports */
import { bench, describe } from 'vitest'
import { format_string } from './index.js'

/* Setup */
const sentence =
	"constantly seek criticism.\fa WELL THOUGHT out critique\nof what you're doing is\nas valuable as gold"
const title = 'elon musk'
const slug = 'Hello_World! This is a Test@String#123'

/* Benchmark */
describe('format_string', () => {
	bench('sentence', () => {
		format_string(sentence, 'sentence')
	})
	bench('title', () => {
		format_string(title, 'title')
	})
	bench('slug', () => {
		format_string(slug, 'slug')
	})
})

/* Imports */
import { bench } from 'vitest'
import { cookie } from './index.js'
import 'global-jsdom/register'

/* Setup */
cookie.set('test', 1)

/* Benchmark */
bench('cookie', () => {
	cookie.get('test')
})

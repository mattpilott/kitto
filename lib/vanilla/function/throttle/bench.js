/* Imports */
import { bench } from 'vitest'
import { throttle } from './index.js'

/* Setup */
const fn = () => console.log('Throttled')
const throttledFn = throttle(fn, 1000)

/* Benchmark */
bench('throttle', () => throttledFn())

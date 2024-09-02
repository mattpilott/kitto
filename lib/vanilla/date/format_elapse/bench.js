/* Imports */
import { bench } from 'vitest'
import { formatElapse } from './index.js'

/* Setup */
const date = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

/* Benchmark */
bench('formatElapse', () => formatElapse(date))

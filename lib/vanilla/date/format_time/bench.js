/* Imports */
import { bench } from 'vitest'
import { formatTime } from './index.js'

/* Setup */
const mins = 90

/* Benchmark */
bench('formatTime', () => formatTime(mins))

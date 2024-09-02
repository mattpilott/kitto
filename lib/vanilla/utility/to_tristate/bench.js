/* Imports */
import { bench } from 'vitest'
import { toTristate } from './index.js'

/* Benchmark */
bench('toTristate', () => toTristate(false))

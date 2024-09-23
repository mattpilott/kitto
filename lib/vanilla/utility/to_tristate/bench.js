/* Imports */
import { bench } from 'vitest'
import { toTristate } from './index.js'

/* Benchmark */
bench('toTristate', () => console.log(toTristate(false)))

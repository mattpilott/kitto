/* Imports */
import { bench } from 'vitest'
import { to_tristate } from './index.js'

/* Benchmark */
bench('to_tristate', () => console.log(to_tristate(false)))

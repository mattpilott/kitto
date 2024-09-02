/* Imports */
import { bench } from 'vitest'
import { yourModuleName } from './index.js'

/* Setup */
const str = 'Some data your module needs'

/* Benchmark */
bench('yourModuleName', () => yourModuleName(str))

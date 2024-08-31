/* Imports */
import { expect, test } from 'vitest'
import yourModuleName from './index.js'

/* Setup */
const data = 'setup data or params'

/* Test */
test('yourModuleName', () => {
	expect(yourModuleName).toBeTypeOf('function')
	expect(yourModuleName(data)).toEqual(true)
})

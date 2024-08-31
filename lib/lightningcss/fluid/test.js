import { describe, it, expect } from 'vitest'
import { fluid } from './index.js'

describe('fluid function', () => {
	it('should generate fluid typography scale with default parameters', () => {
		const fluidFunc = fluid().Function.fluid
		const input = {
			arguments: [{ value: { value: 1, unit: 'rem' } }, null, { value: { value: 2, unit: 'rem' } }]
		}
		const result = fluidFunc(input)
		expect(result).toEqual({
			raw: 'clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 0.0625), 2rem)'
		})
	})

	it('should generate fluid typography scale with custom parameters', () => {
		const fluidFunc = fluid({ vmin: 400, vmax: 1200, root: 16 }).Function.fluid
		const input = {
			arguments: [{ value: { value: 1, unit: 'rem' } }, null, { value: { value: 2, unit: 'rem' } }]
		}
		const result = fluidFunc(input)
		expect(result).toEqual({
			raw: 'clamp(1rem, 1.0000rem + ((1vw - 4.0px) * 0.1250), 2rem)'
		})
	})

	it('should generate fluid typography scale with px units', () => {
		const fluidFunc = fluid({ vmin: 0, vmax: 1600, root: 16 }).Function.fluid
		const input = {
			arguments: [{ value: { value: 16, unit: 'px' } }, null, { value: { value: 32, unit: 'px' } }]
		}
		const result = fluidFunc(input)
		expect(result).toEqual({
			raw: 'clamp(16px, 1.0000rem + ((1vw - 0.0px) * 0.0625), 32px)'
		})
	})

	it('should generate fluid typography scale with mixed units', () => {
		const fluidFunc = fluid({ vmin: 0, vmax: 1600, root: 16 }).Function.fluid
		const input = {
			arguments: [{ value: { value: 1, unit: 'rem' } }, null, { value: { value: 32, unit: 'px' } }]
		}
		const result = fluidFunc(input)
		expect(result).toEqual({
			raw: 'clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 0.0625), 32px)'
		})
	})
})

import { describe, it, expect, beforeEach } from 'vitest'
import { fluid } from './index.js' // Adjust the import path as needed

describe('fluid typography visitor', () => {
	const defaultParams = { vmin: 0, vmax: 1600, root: 16 }
	let fluidVisitor

	beforeEach(() => {
		fluidVisitor = fluid(defaultParams)
	})

	const createMockArgument = (value, unit) => ({
		value: { value, unit }
	})

	it('generates correct clamp function for rem units', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(1, 'rem'), {}, createMockArgument(2, 'rem')]
		})

		expect(result.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 1.0000), 2rem)')
	})

	it('generates correct clamp function for px units', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(16, 'px'), {}, createMockArgument(32, 'px')]
		})

		expect(result.raw).toBe('clamp(16px, 1.0000rem + ((1vw - 0.0px) * 1.0000), 32px)')
	})

	it('handles mixed units (px and rem)', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(16, 'px'), {}, createMockArgument(2, 'rem')]
		})

		expect(result.raw).toBe('clamp(16px, 1.0000rem + ((1vw - 0.0px) * 1.0000), 2rem)')
	})

	it('works with custom vmin, vmax, and root values', () => {
		fluidVisitor = fluid({ vmin: 320, vmax: 1920, root: 18 })
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(1, 'rem'), {}, createMockArgument(2, 'rem')]
		})

		expect(result.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 3.2px) * 1.1250), 2rem)')
	})

	it('handles small differences between min and max sizes', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(0.9, 'rem'), {}, createMockArgument(1, 'rem')]
		})

		expect(result.raw).toBe('clamp(0.9rem, 0.9000rem + ((1vw - 0.0px) * 0.1000), 1rem)')
	})

	it('handles large differences between min and max sizes', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(1, 'rem'), {}, createMockArgument(10, 'rem')]
		})

		expect(result.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 9.0000), 10rem)')
	})

	it('handles decimal values', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(1.2, 'rem'), {}, createMockArgument(2.5, 'rem')]
		})

		expect(result.raw).toBe('clamp(1.2rem, 1.2000rem + ((1vw - 0.0px) * 1.3000), 2.5rem)')
	})

	it('handles zero as minimum value', () => {
		const result = fluidVisitor.Function.fluid({
			arguments: [createMockArgument(0, 'px'), {}, createMockArgument(16, 'px')]
		})

		expect(result.raw).toBe('clamp(0px, 0.0000rem + ((1vw - 0.0px) * 1.0000), 16px)')
	})
})

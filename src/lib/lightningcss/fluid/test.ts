import { describe, it, expect, beforeEach } from 'vitest'
import { fluid } from './index.js'
import type { LengthUnit } from 'lightningcss'

describe('fluid typography visitor', () => {
	const default_params = { vmin: 0, vmax: 1600, root: 16 }
	let fluid_visitor: ReturnType<typeof fluid>

	beforeEach(() => {
		fluid_visitor = fluid(default_params)
	})

	const create_mock_argument = (value: number, unit: LengthUnit) =>
		({
			type: 'length',
			value: { value, unit }
		}) as const

	it('generates correct clamp function for rem units', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(1, 'rem'), {} as never, create_mock_argument(2, 'rem')]
		})

		expect(result!.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 1.0000), 2rem)')
	})

	it('generates correct clamp function for px units', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(16, 'px'), {} as never, create_mock_argument(32, 'px')]
		})

		expect(result!.raw).toBe('clamp(16px, 1.0000rem + ((1vw - 0.0px) * 1.0000), 32px)')
	})

	it('handles mixed units (px and rem)', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(16, 'px'), {} as never, create_mock_argument(2, 'rem')]
		})

		expect(result!.raw).toBe('clamp(16px, 1.0000rem + ((1vw - 0.0px) * 1.0000), 2rem)')
	})

	it('works with custom vmin, vmax, and root values', () => {
		fluid_visitor = fluid({ vmin: 320, vmax: 1920, root: 18 })
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(1, 'rem'), {} as never, create_mock_argument(2, 'rem')]
		})

		expect(result!.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 3.2px) * 1.1250), 2rem)')
	})

	it('handles small differences between min and max sizes', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(0.9, 'rem'), {} as never, create_mock_argument(1, 'rem')]
		})

		expect(result!.raw).toBe('clamp(0.9rem, 0.9000rem + ((1vw - 0.0px) * 0.1000), 1rem)')
	})

	it('handles large differences between min and max sizes', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(1, 'rem'), {} as never, create_mock_argument(10, 'rem')]
		})

		expect(result!.raw).toBe('clamp(1rem, 1.0000rem + ((1vw - 0.0px) * 9.0000), 10rem)')
	})

	it('handles decimal values', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(1.2, 'rem'), {} as never, create_mock_argument(2.5, 'rem')]
		})

		expect(result!.raw).toBe('clamp(1.2rem, 1.2000rem + ((1vw - 0.0px) * 1.3000), 2.5rem)')
	})

	it('handles zero as minimum value', () => {
		const result = fluid_visitor.Function.fluid({
			name: 'fluid',
			arguments: [create_mock_argument(0, 'px'), {} as never, create_mock_argument(16, 'px')]
		})

		expect(result!.raw).toBe('clamp(0px, 0.0000rem + ((1vw - 0.0px) * 1.0000), 16px)')
	})
})

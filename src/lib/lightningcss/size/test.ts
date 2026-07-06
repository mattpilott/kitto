import { describe, it, expect } from 'vitest'
import { size } from './index.js'

const whitespace = { type: 'token', value: { type: 'white-space', value: ' ' } } as const

describe('size visitor', () => {
	it('should convert size: 100px to height: 100px and width: 100px', () => {
		const input = { name: 'size', value: [{ type: 'length', value: { unit: 'px', value: 100 } } as const] }
		const result = size.Declaration.custom.size(input)
		expect(result).toEqual([
			{
				property: 'height',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: { unit: 'px', value: 100 } }
				}
			},
			{
				property: 'width',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: { unit: 'px', value: 100 } }
				}
			}
		])
	})

	it('should convert size: 100px 200px to height: 100px and width: 200px', () => {
		const input = {
			name: 'size',
			value: [
				{ type: 'length', value: { unit: 'px', value: 100 } } as const,
				whitespace,
				{ type: 'length', value: { unit: 'px', value: 200 } } as const
			]
		}
		const result = size.Declaration.custom.size(input)
		expect(result).toEqual([
			{
				property: 'height',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: { unit: 'px', value: 100 } }
				}
			},
			{
				property: 'width',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: { unit: 'px', value: 200 } }
				}
			}
		])
	})

	it('should throw an error for unsupported value type', () => {
		const input = { name: 'size', value: [{ type: 'unsupported', value: 100 }] }
		expect(() => size.Declaration.custom.size(input as never)).toThrowError(
			'Unsupported value type: unsupported'
		)
	})

	it('should convert size: 50% to height: 50% and width: 50%', () => {
		const input = {
			name: 'size',
			value: [{ type: 'token', value: { type: 'percentage', value: 50 } } as const]
		}
		const result = size.Declaration.custom.size(input)
		expect(result).toEqual([
			{
				property: 'height',
				value: { type: 'length-percentage', value: { type: 'percentage', value: 50 } }
			},
			{
				property: 'width',
				value: { type: 'length-percentage', value: { type: 'percentage', value: 50 } }
			}
		])
	})
})

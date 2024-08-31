import { describe, it, expect } from 'vitest'
import { size } from './index.js'

describe('size visitor', () => {
	it('should convert size: 100px to height: 100px and width: 100px', () => {
		const input = { value: [{ type: 'length', value: 100, unit: 'px' }] }
		const result = size.Declaration.custom.size(input)
		expect(result).toEqual([
			{
				property: 'height',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: 100, unit: 'px' }
				}
			},
			{
				property: 'width',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: 100, unit: 'px' }
				}
			}
		])
	})

	it('should convert size: 100px 200px to height: 100px and width: 200px', () => {
		const input = {
			value: [{ type: 'length', value: 100, unit: 'px' }, null, { type: 'length', value: 200, unit: 'px' }]
		}
		const result = size.Declaration.custom.size(input)
		expect(result).toEqual([
			{
				property: 'height',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: 100, unit: 'px' }
				}
			},
			{
				property: 'width',
				value: {
					type: 'length-percentage',
					value: { type: 'dimension', value: 200, unit: 'px' }
				}
			}
		])
	})

	it('should throw an error for unsupported value type', () => {
		const input = { value: [{ type: 'unsupported', value: 100 }] }
		expect(() => size.Declaration.custom.size(input)).toThrowError('Unsupported value type: unsupported')
	})

	it('should convert size: 50% to height: 50% and width: 50%', () => {
		const input = { value: [{ type: 'token', value: { type: 'percentage', value: 50 } }] }
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

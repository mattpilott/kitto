import type { LengthUnit } from 'lightningcss'

/**
 * @module size
 * @group LightningCSS
 * @version 1.0.0
 * @remarks Shorthand for height and width css properties.
 *
 * @param [params={}] - The parameters object.
 * @param [params.vmin=0] - The minimum viewport width.
 * @param [params.vmax=1600] - The maximum viewport width.
 * @param [params.root=16] - The root font size in pixels.
 * @returns An object containing the `fluid` function.
 *
 * @example
 * ```css
 * div { size: 100px; } = div { height: 100px; width: 100px; }
 * div { size: 100px 200px; } = div { height: 100px; width: 200px; }
 * ```
 */

type Value =
	| {
			type: 'length'
			value: number
			unit: LengthUnit
	  }
	| {
			type: 'token'
			value: {
				type: 'percentage'
				value: number
			}
	  }
	| null

export const size = {
	Declaration: {
		custom: {
			size({ value }: { value: Array<Value> }) {
				function parse_value(token_or_value: Value) {
					if (!token_or_value) return
					const { type, value } = token_or_value
					const obj = { type: 'length-percentage' } as const

					if (type === 'length') {
						return {
							...obj,
							value: { type: 'dimension', value, unit: token_or_value.unit as LengthUnit }
						} as const
					}

					if (type === 'token') {
						return {
							...obj,
							value: { type: 'percentage', value: value.value }
						} as const
					}

					throw new Error(`Unsupported value type: ${type}`)
				}

				const height = parse_value(value[0])
				const width = value[2] ? parse_value(value[2]) : height

				return [
					{ property: 'height', value: height },
					{ property: 'width', value: width }
				]
			}
		}
	}
}

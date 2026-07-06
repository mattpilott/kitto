import type { CustomAtRules, CustomProperty, TokenOrValue, Visitor } from 'lightningcss'

/**
 * @module size
 * @group LightningCSS
 * @version 1.0.1
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

export const size = {
	Declaration: {
		custom: {
			size({ value }: CustomProperty) {
				function parse_value(token_or_value: TokenOrValue | undefined) {
					if (!token_or_value) return

					if (token_or_value.type === 'length') {
						return {
							type: 'length-percentage',
							value: { type: 'dimension', value: token_or_value.value }
						} as const
					}

					if (token_or_value.type === 'token' && token_or_value.value.type === 'percentage') {
						return {
							type: 'length-percentage',
							value: { type: 'percentage', value: token_or_value.value.value }
						} as const
					}

					throw new Error(`Unsupported value type: ${token_or_value.type}`)
				}

				const height = parse_value(value[0])
				const width = value[2] ? parse_value(value[2]) : height

				if (!height || !width) return

				return [
					{ property: 'height', value: height },
					{ property: 'width', value: width }
				]
			}
		}
	}
} satisfies Visitor<CustomAtRules>

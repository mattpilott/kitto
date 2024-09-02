/**
 * @module size
 * @description Shorthand for height and width css properties.
 * @memberof LightningCSS
 * @version 1.0.0
 * @param {Object} [params={}] - The parameters object.
 * @param {number} [params.vmin=0] - The minimum viewport width.
 * @param {number} [params.vmax=1600] - The maximum viewport width.
 * @param {number} [params.root=16] - The root font size in pixels.
 * @returns {Object} - An object containing the `fluid` function.
 *
 * @example
 * div { size: 100px; } = div { height: 100px; width: 100px; }
 * div { size: 100px 200px; } = div { height: 100px; width: 200px; }
 */
export const size = {
	Declaration: {
		custom: {
			size({ value }) {
				const parseValue = ({ type, value, unit }) => {
					const obj = { type: 'length-percentage' }
					if (type === 'length') {
						return { ...obj, value: { type: 'dimension', value, unit } }
					}
					if (type === 'token') {
						return { ...obj, value: { type: 'percentage', value: value.value } }
					}
					throw new Error(`Unsupported value type: ${type}`)
				}

				const height = parseValue(value[0])
				const width = value[2] ? parseValue(value[2]) : height

				return [
					{ property: 'height', value: height },
					{ property: 'width', value: width }
				]
			}
		}
	}
}

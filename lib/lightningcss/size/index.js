/**
 * Shorthand for height and width css properties.
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

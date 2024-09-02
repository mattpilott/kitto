/**
 * @module fluid
 * @description Generates a fluid typography scale based on the provided min and max viewport and font sizes.
 * @memberof LightningCSS
 * @version 1.0.0
 * @param {Object} [params={}] - The parameters object.
 * @param {number} [params.vmin=0] - The minimum viewport width.
 * @param {number} [params.vmax=1600] - The maximum viewport width.
 * @param {number} [params.root=16] - The root font size in pixels.
 * @returns {Object} - An object containing the `fluid` function.
 */
export const fluid = ({ vmin = 0, vmax = 1600, root = 16 } = {}) => ({
	Function: {
		fluid({ arguments: [{ value: miny }, , { value: maxy }] }) {
			const toPx = (value, unit) => (unit === 'rem' ? value * root : value)

			const minyInPx = toPx(miny.value, miny.unit)
			const maxyInPx = toPx(maxy.value, maxy.unit)

			const min = `${miny.value}${miny.unit}`
			const max = `${maxy.value}${maxy.unit}`

			const rem = minyInPx / root

			const vminFactor = vmin / 100
			const scaleFactor = (100 * (maxyInPx - minyInPx)) / (vmax - vmin)

			const scalar = `${rem.toFixed(4)}rem + ((1vw - ${vminFactor.toFixed(1)}px) * ${scaleFactor.toFixed(4)})`

			return { raw: `clamp(${min}, ${scalar}, ${max})` }
		}
	}
})

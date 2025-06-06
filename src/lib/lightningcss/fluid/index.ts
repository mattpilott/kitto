import type { CustomAtRules, Visitor } from 'lightningcss'

function is_length(value: unknown) {
	return typeof value === 'object' && 'unit' in value!
}

/**
 * @module fluid
 * @group LightningCSS
 * @version 1.0.0
 * @remarks Generates a fluid typography scale based on the provided min and max viewport and font sizes.
 *
 * @param [params={}] - The parameters object.
 * @param [params.vmin=0] - The minimum viewport width.
 * @param [params.vmax=1600] - The maximum viewport width.
 * @param [params.root=16] - The root font size in pixels.
 *
 * @example
 * ```ts
 * import { fluid } from 'lightningcss'
 *
 * const fluid = fluid({ vmin: 0, vmax: 1600, root: 16 })
 * ```
 *
 * @returns An object containing the `fluid` function.
 */

export const fluid = ({ vmin = 0, vmax = 1600, root = 16 } = {}) =>
	({
		Function: {
			fluid({ arguments: [{ value: min_y }, , { value: max_y }] }) {
				const to_px = (value: number, unit: string) => (unit === 'rem' ? value * root : value)

				if (!is_length(min_y) || !is_length(max_y)) return

				const min_y_in_px = to_px(min_y.value, min_y.unit)
				const max_y_in_px = to_px(max_y.value, max_y.unit)

				const min = `${min_y.value}${min_y.unit as string}`
				const max = `${max_y.value}${max_y.unit as string}`

				const rem = min_y_in_px / root

				const vmin_factor = vmin / 100
				const scale_factor = (100 * (max_y_in_px - min_y_in_px)) / (vmax - vmin)

				const scalar = `${rem.toFixed(4)}rem + ((1vw - ${vmin_factor.toFixed(1)}px) * ${scale_factor.toFixed(4)})`

				return { raw: `clamp(${min}, ${scalar}, ${max})` }
			}
		}
	}) satisfies Visitor<CustomAtRules>

import type { CustomAtRules, Visitor } from 'lightningcss'

function is_length(value: unknown): value is { unit: string; value: number } {
	return typeof value === 'object' && value !== null && 'unit' in value && 'value' in value
}

/**
 * @module fluid
 * @group LightningCSS
 * @version 3.0.0
 * @remarks Generates a fluid typography scale based on the provided min and max viewport and font sizes.
 * Values may be negative, and may descend (`fluid(-1.5rem, -2.5rem)`, `fluid(2rem, 1rem)`) — the
 * clamp bounds are ordered by size, so the scale still runs from the first value to the second.
 *
 * @param [params={}] - The parameters object.
 * @param [params.vmin=360] - The minimum viewport width.
 * @param [params.vmax=1600] - The maximum viewport width.
 * @param [params.root=16] - The root font size in pixels.
 *
 * @example
 * ```ts
 * import { fluid } from 'lightningcss'
 *
 * const fluid = fluid({ vmin: 360, vmax: 1600, root: 16 })
 * ```
 *
 * @returns An object containing the `fluid` function.
 */

export const fluid = ({ vmin = 360, vmax = 1600, root = 16 } = {}) =>
	({
		Function: {
			fluid(fn) {
				const length_args = fn.arguments.filter(arg => arg.type === 'length').map(arg => arg.value)
				const [min_y, max_y] = length_args

				if (!is_length(min_y) || !is_length(max_y)) return

				const to_px = (value: number, unit: string) => (unit === 'rem' ? value * root : value)

				const min_y_in_px = to_px(min_y.value, min_y.unit)
				const max_y_in_px = to_px(max_y.value, max_y.unit)

				const min = `${min_y.value}${min_y.unit as string}`
				const max = `${max_y.value}${max_y.unit as string}`

				const rem = min_y_in_px / root

				const vmin_factor = vmin / 100
				const scale_factor = (100 * (max_y_in_px - min_y_in_px)) / (vmax - 2 - vmin)

				const scalar = `${rem.toFixed(4)}rem + ((1vw - ${vmin_factor.toFixed(1)}px) * ${scale_factor.toFixed(4)})`

				// clamp needs its bounds in ascending order, which a scale that shrinks with the
				// viewport — `fluid(-1.5rem, -2.5rem)`, `fluid(2rem, 1rem)` — hands over reversed
				const [lower, upper] = min_y_in_px <= max_y_in_px ? [min, max] : [max, min]

				return { raw: `clamp(${lower}, ${scalar}, ${upper})` }
			}
		}
	}) satisfies Visitor<CustomAtRules>

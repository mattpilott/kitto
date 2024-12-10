/**
 * @module breakpoints
 * @description Generates a media query handler for custom breakpoints.
 * @memberof LightningCSS
 * @version 1.0.0
 * @param {Object} breakpoints - An object containing breakpoint values.
 * @returns {Object} - An object with a Rule containing the media function.
 */
export const breakpoints = breakpoints => ({
	Rule: {
		media(media) {
			const [mediaQuery] = media.value.query.mediaQueries
			const { operator, conditions, value } = mediaQuery.condition
			const conds = value ? [{ value }] : conditions
			const queries = []

			for (const item of conds) {
				if (!item.value.name.startsWith('--')) return media

				const name = item.value.name.replace('--', '').split('-').pop()

				if (!Object.prototype.hasOwnProperty.call(breakpoints, name)) return media
			}

			conds.forEach(({ value: { name } }) => {
				const [till, device] = name.split('--').pop().split('-')
				const minmax = till === 'from' ? 'min' : 'max'
				const point = breakpoints[device] - ~~(till !== 'from')

				queries.push(`(${minmax}-width: ${point / 16}em)`)
			})
			const raw = queries.join(queries.length > 1 ? ` ${operator} ` : '')

			media.value.query = { mediaQueries: [{ raw }] }

			return media
		}
	}
})

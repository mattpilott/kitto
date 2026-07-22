import type { CustomAtRules, MediaQuery, Visitor } from 'lightningcss'

/**
 * @module breakpoints
 * @group LightningCSS
 * @version 3.0.0
 * @remarks Generates a media query handler for custom breakpoints. Queries use
 * `(--from-<breakpoint>)` for min-width, `(--until-<breakpoint>)` for max-width and
 * `(--only-<breakpoint>)` for the range from that breakpoint until the next one up
 * (open-ended on the largest); any other prefix on a known breakpoint throws at build time.
 *
 * @param breakpoints - An object containing breakpoint values.
 * @returns An object with a Rule containing the media function.
 */

export const breakpoints = (breakpoints: Record<string, number>) =>
	({
		MediaQuery(query: MediaQuery) {
			const operator = query.condition && 'operator' in query.condition ? query.condition.operator : 'and'
			const conditions = query.condition && 'conditions' in query.condition ? query.condition.conditions : []
			const value = query.condition && 'value' in query.condition ? query.condition.value : undefined

			const conds = value ? [{ value }] : (conditions ?? [])
			const queries: Array<string> = []

			for (const item of conds) {
				if (!('value' in item)) return query
				if (!('name' in item.value)) return query
				if (!item.value.name.startsWith('--')) return query

				const name = item.value.name.replace('--', '').split('-').pop()
				if (!name) return query

				if (!Object.prototype.hasOwnProperty.call(breakpoints, name)) return query
			}

			conds.forEach(cond => {
				if (!('value' in cond) || !('name' in cond.value)) return
				const { name } = cond.value
				const [prefix, device] = name.split('--').pop()?.split('-') ?? []

				if (prefix === 'from' || prefix === 'until') {
					const minmax = prefix === 'from' ? 'min' : 'max'
					const point = breakpoints[device] - ~~(prefix !== 'from')

					queries.push(`(${minmax}-width: ${point / 16}em)`)
				} else if (prefix === 'only') {
					// span from this breakpoint until just before the next one up;
					// the largest breakpoint has nothing above, so it stays open-ended
					const from = breakpoints[device]
					const next = Math.min(...Object.values(breakpoints).filter(value => value > from))
					const range = Number.isFinite(next)
						? `(min-width: ${from / 16}em) and (max-width: ${(next - 1) / 16}em)`
						: `(min-width: ${from / 16}em)`

					queries.push(conds.length > 1 ? `(${range})` : range)
				} else {
					const target = device ?? prefix
					throw new Error(
						`[kitto] unknown breakpoint query (${name}); use (--from-${target}) for min-width, (--until-${target}) for max-width or (--only-${target}) for just that range`
					)
				}
			})

			if (!queries.length) return query

			const raw = queries.join(queries.length > 1 ? ` ${operator} ` : '')

			// Use ReturnedMediaQuery's raw-string form so LightningCSS can re-parse it.
			return { raw }
		}
	}) satisfies Visitor<CustomAtRules>

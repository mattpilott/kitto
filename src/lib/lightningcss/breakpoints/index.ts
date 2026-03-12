import type { CustomAtRules, MediaQuery, Visitor } from 'lightningcss'

/**
 * @module breakpoints
 * @group LightningCSS
 * @version 2.0.0
 * @remarks Generates a media query handler for custom breakpoints.
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
				const [till, device] = name.split('--').pop()?.split('-') ?? []
				if (!till || !device) return

				const minmax = till === 'from' ? 'min' : 'max'
				const point = breakpoints[device] - ~~(till !== 'from')

				queries.push(`(${minmax}-width: ${point / 16}em)`)
			})

			if (!queries.length) return query

			const raw = queries.join(queries.length > 1 ? ` ${operator} ` : '')

			// Use ReturnedMediaQuery's raw-string form so LightningCSS can re-parse it.
			return { raw }
		}
	}) satisfies Visitor<CustomAtRules>

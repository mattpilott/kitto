import type { CustomAtRules, Visitor } from 'lightningcss'

/**
 * @module breakpoints
 * @group LightningCSS
 * @version 1.0.0
 * @remarks Generates a media query handler for custom breakpoints.
 *
 * @param breakpoints - An object containing breakpoint values.
 * @returns An object with a Rule containing the media function.
 */

export const breakpoints = (breakpoints: Record<string, number>) =>
	({
		Rule: {
			media(media) {
				const [mq] = media.value.query.mediaQueries
				const operator = mq.condition && 'operator' in mq.condition ? mq.condition.operator : 'and'
				const conditions = mq.condition && 'conditions' in mq.condition ? mq.condition.conditions : []
				const value = mq.condition && 'value' in mq.condition ? mq.condition.value : undefined

				const conds = value ? [{ value }] : (conditions ?? [])
				const queries: Array<string> = []

				for (const item of conds) {
					if (!('value' in item)) return media
					if (!('name' in item.value)) return media
					if (!item.value.name.startsWith('--')) return media

					const name = item.value.name.replace('--', '').split('-').pop()
					if (!name) return media

					if (!Object.prototype.hasOwnProperty.call(breakpoints, name)) return media
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
				const raw = queries.join(queries.length > 1 ? ` ${operator} ` : '')

				media.value.query = { mediaQueries: [{ raw } as never] }

				return media
			}
		}
	}) satisfies Visitor<CustomAtRules>

import type { CustomAtRules, MediaCondition, MediaQuery, Visitor } from 'lightningcss'

/**
 * @module breakpoints
 * @group LightningCSS
 * @version 3.1.0
 * @remarks Generates a media query handler for custom breakpoints. Queries use
 * `(--from-<breakpoint>)` for min-width, `(--until-<breakpoint>)` for max-width and
 * `(--only-<breakpoint>)` for the range from that breakpoint until the next one up
 * (open-ended on the largest); any other prefix on a known breakpoint throws at build time.
 *
 * Breakpoints may appear anywhere in the condition — combined with ordinary features,
 * negated, or nested in a group — and the media type and qualifier are preserved, so
 * `@media print and (--from-md)` stays a print query.
 *
 * @param breakpoints - An object containing breakpoint values.
 * @returns An object with a Rule containing the media function.
 */

export const breakpoints = (breakpoints: Record<string, number>) =>
	({
		MediaQuery(query: MediaQuery) {
			let changed = false

			// range syntax, which lightningcss lowers back to min-/max-width for older targets
			const width = (operator: 'greater-than-equal' | 'less-than-equal', px: number): MediaCondition => ({
				type: 'feature',
				value: {
					type: 'range',
					name: 'width',
					operator,
					value: { type: 'length', value: { type: 'value', value: { unit: 'em', value: px / 16 } } }
				}
			})

			const visit = (condition: MediaCondition): MediaCondition => {
				if (condition.type === 'not') return { type: 'not', value: visit(condition.value) }
				if (condition.type === 'operation')
					return { ...condition, conditions: condition.conditions.map(visit) }
				if (condition.type !== 'feature') return condition

				const name = String(condition.value.name)
				if (!name.startsWith('--')) return condition

				const known = (key: string) => Object.hasOwn(breakpoints, key)
				const [prefix, ...rest] = name.slice(2).split('-')
				const device = rest.join('-')

				if (known(device) && (prefix === 'from' || prefix === 'until' || prefix === 'only')) {
					changed = true
					const from = breakpoints[device]

					if (prefix === 'from') return width('greater-than-equal', from)
					if (prefix === 'until') return width('less-than-equal', from - 1)

					// span from this breakpoint until just before the next one up;
					// the largest breakpoint has nothing above, so it stays open-ended
					const next = Math.min(...Object.values(breakpoints).filter(value => value > from))
					const min = width('greater-than-equal', from)

					return Number.isFinite(next)
						? { type: 'operation', operator: 'and', conditions: [min, width('less-than-equal', next - 1)] }
						: min
				}

				// a name pointing at a real breakpoint is a kitto query with a typo; anything
				// else is someone else's custom media query, so leave it be
				const target = known(device) ? device : known(name.slice(2)) ? name.slice(2) : ''
				if (!target) return condition

				throw new Error(
					`[kitto] unknown breakpoint query (${name}); use (--from-${target}) for min-width, (--until-${target}) for max-width or (--only-${target}) for just that range`
				)
			}

			const condition = query.condition ? visit(query.condition) : query.condition

			return changed ? { ...query, condition } : query
		}
	}) satisfies Visitor<CustomAtRules>

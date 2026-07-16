import type { CustomAtRules, CustomProperty, TokenOrValue, Visitor } from 'lightningcss'

/**
 * @module size
 * @group LightningCSS
 * @version 2.0.0
 * @remarks Shorthand for the height and width css properties. Accepts any valid
 * height/width value: lengths in any unit, percentages, keywords, `var()`,
 * `calc()` and friends.
 *
 * @example
 * ```css
 * div { size: 100px; } = div { height: 100px; width: 100px; }
 * div { size: 100px 200px; } = div { height: 100px; width: 200px; }
 * div { size: 50% auto; } = div { height: 50%; width: auto; }
 * div { size: var(--s); } = div { height: var(--s); width: var(--s); }
 * div { size: calc(100% - 2rem) min(50vw, 300px); }
 * ```
 */

// lightningcss's deserializer rejects the explicit nulls its own parser emits
function strip_nulls<T>(value: T): T {
	if (Array.isArray(value)) return value.map(strip_nulls) as T
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, v]) => v !== null)
				.map(([k, v]) => [k, strip_nulls(v)])
		) as T
	return value
}

export const size = {
	Declaration: {
		custom: {
			size({ value }: CustomProperty) {
				// group tokens by top-level whitespace: `size: <height> <width>?`
				const groups: TokenOrValue[][] = [[]]
				for (const token of value) {
					if (token.type === 'token' && token.value.type === 'white-space') groups.push([])
					else groups.at(-1)!.push(strip_nulls(token))
				}

				const [height, width = height, extra] = groups.filter(group => group.length)
				if (!height) return
				if (extra) throw new Error('size accepts at most two values: `size: <height> <width>?`')

				return [
					{ property: 'unparsed', value: { propertyId: { property: 'height' }, value: height } },
					{ property: 'unparsed', value: { propertyId: { property: 'width' }, value: width } }
				] as const
			}
		}
	}
} satisfies Visitor<CustomAtRules>

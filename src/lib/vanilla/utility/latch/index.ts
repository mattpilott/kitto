/**
 * @module latch
 * @group Vanilla
 * @version 1.0.0
 * @remarks Latches URL-param signals into cookies: the param is momentary, the
 * stored value holds until a counter-signal releases it. Intended to run once
 * per request, server side, to resolve sticky preferences.
 *
 * Each key names a cookie and takes one of two specs:
 * - `{ on, off }` — signals that set and clear a boolean. A bare name checks for
 *   the param's presence (`'android'`), `name=value` checks its value (`'st=1'`).
 *   The two signals may use different params. Returns a boolean; the cookie is
 *   set to `'true'` or deleted. If both signals fire, `off` wins.
 * - `string[]` — the allowed values for a preference read from a param of the
 *   same name. Only a valid param persists; anything else is ignored. Returns
 *   the stored value, falling back to the first entry when unset or invalid.
 *
 * @param jar - Cookie accessor, e.g. SvelteKit's `cookies`
 * @param url - The current request URL
 * @param specs - Cookie name to toggle signals or allowed values
 * @param options - Cookie `path` and `maxAge`, applied to every write
 * @returns The resolved value for each key
 *
 * @example
 * ```ts
 * const { android, stage, appearance } = latch(cookies, url, {
 *   android: { on: 'android', off: 'ios' },
 *   stage: { on: 'st=1', off: 'st=0' },
 *   appearance: ['system', 'light', 'dark']
 * })
 * // android: boolean, stage: boolean, appearance: 'system' | 'light' | 'dark'
 * ```
 */

const YEAR = 60 * 60 * 24 * 365

export type Jar = {
	get: (name: string) => string | undefined
	set: (name: string, value: string, options: { path: string; maxAge?: number }) => void
	delete: (name: string, options: { path: string }) => void
}

export type LatchSpec = { on: string; off: string } | readonly string[]

export type LatchOptions = { path?: string; maxAge?: number }

export type Latched<T> = { [K in keyof T]: T[K] extends readonly (infer V)[] ? V : boolean }

/** Is `signal` present in the URL? A bare name checks presence, `name=value` checks the value. */
function signalled(url: URL, signal: string): boolean {
	const [param, value] = signal.split('=')

	return value === undefined ? url.searchParams.has(param) : url.searchParams.get(param) === value
}

export function latch<const T extends Record<string, LatchSpec>>(
	jar: Jar,
	url: URL,
	specs: T,
	{ path = '/', maxAge = YEAR }: LatchOptions = {}
): Latched<T> {
	const latched: Record<string, string | boolean> = {}

	for (const [name, spec] of Object.entries(specs)) {
		const current = jar.get(name)

		if ('on' in spec) {
			let latch_on = !!current

			if (!latch_on && signalled(url, spec.on)) {
				jar.set(name, 'true', { path, maxAge })
				latch_on = true
			}

			if (latch_on && signalled(url, spec.off)) {
				jar.delete(name, { path })
				latch_on = false
			}

			latched[name] = latch_on

			continue
		}

		const allowed = (value: string | null | undefined) => (value && spec.includes(value) ? value : undefined)
		const chosen = allowed(url.searchParams.get(name))

		// Only an explicit choice persists — a first visit shouldn't write a default.
		if (chosen && chosen !== current) jar.set(name, chosen, { path, maxAge })

		latched[name] = chosen ?? allowed(current) ?? spec[0]
	}

	return latched as Latched<T>
}

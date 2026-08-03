/**
 * @module latch
 * @group Vanilla
 * @version 1.0.0
 * @remarks Latches URL params into cookies: the param is momentary, the stored
 * value holds until something clears it. Runs once per request server side, or
 * against `document.cookie` in the browser.
 *
 * Each key names a cookie and takes one of three specs:
 * - `true` — store whatever the param says, no allow-list. Returns the stored
 *   string, or `undefined` when nothing is set.
 * - `string[]` — the values the param may take. Anything else is ignored.
 *   Returns the stored value, falling back to the first entry.
 * - `{ on, off }` — signals that set and clear a boolean. A bare name checks the
 *   param's presence (`'android'`), `name=value` checks its value (`'st=1'`).
 *   The two may use different params. If both fire, `off` wins.
 *
 * A valueless param (`?appearance=`) clears the cookie in the `true` and
 * `string[]` forms, which is how removal is signalled. Presence-only params are
 * the `{ on, off }` form's job.
 *
 * `jar` and `url` are inferred from `document.cookie` and `location` when
 * omitted, so the browser needs neither. On a server, pass both.
 *
 * Cookies are written `httpOnly` and `secure`. Turn `httpOnly` off for values
 * the client needs to read — the inferred browser jar cannot set it either way,
 * since `document.cookie` has no access to `HttpOnly`.
 *
 * @param specs - Cookie name to spec
 * @param options - Where to read and write, plus the attributes of every write
 * @returns The resolved value for each key
 *
 * @example
 * ```ts
 * const { android, stage, appearance, ref } = latch(
 *   {
 *     android: { on: 'android', off: 'ios' },
 *     stage: { on: 'st=1', off: 'st=0' },
 *     appearance: ['system', 'light', 'dark'],
 *     ref: true
 *   },
 *   { jar: cookies, url }
 * )
 * // android: boolean, appearance: 'system' | 'light' | 'dark', ref: string | undefined
 * ```
 */

const YEAR = 60 * 60 * 24 * 365

export type JarOptions = {
	path: string
	maxAge?: number
	httpOnly?: boolean
	secure?: boolean
}

export type Jar = {
	get: (name: string) => string | undefined
	set: (name: string, value: string, options: JarOptions) => void
	delete: (name: string, options: { path: string }) => void
}

export type LatchSpec = { on: string; off: string } | readonly string[] | true

export type LatchOptions = {
	/** Where cookies live. Defaults to `document.cookie`. */
	jar?: Jar
	/** The URL to read params from. Defaults to `location.href`. */
	url?: URL
	path?: string
	maxAge?: number
	httpOnly?: boolean
	secure?: boolean
}

export type Latched<T> = {
	[K in keyof T]: T[K] extends readonly string[] ? T[K][number] : T[K] extends true ? string | undefined : boolean
}

/** Is `signal` present in the URL? A bare name checks presence, `name=value` checks the value. */
function signalled(url: URL, signal: string): boolean {
	const [param, value] = signal.split('=')

	return value === undefined ? url.searchParams.has(param) : url.searchParams.get(param) === value
}

/** A jar backed by `document.cookie`. `httpOnly` is unavailable to it, as it is to any script. */
function gen_document_jar(): Jar {
	const attributes = ({ path, maxAge, secure }: JarOptions) =>
		`Path=${path}${maxAge === undefined ? '' : `; Max-Age=${maxAge}`}${secure ? '; Secure' : ''}`

	const read = (name: string) =>
		document.cookie
			.split('; ')
			.find(pair => pair.startsWith(`${name}=`))
			?.slice(name.length + 1)

	return {
		get: name => {
			const raw = read(name)

			return raw === undefined ? undefined : decodeURIComponent(raw)
		},
		set: (name, value, options) => {
			document.cookie = `${name}=${encodeURIComponent(value)}; ${attributes(options)}`
		},
		delete: (name, { path }) => {
			document.cookie = `${name}=; Path=${path}; Max-Age=0`
		}
	}
}

export function latch<const T extends Record<string, LatchSpec>>(
	specs: T,
	options: LatchOptions = {}
): Latched<T> {
	const { path = '/', maxAge = YEAR, httpOnly = true, secure = true } = options

	if (!options.jar && typeof document === 'undefined') {
		throw new Error('latch: no `jar` given and no `document` to infer one from')
	}

	if (!options.url && typeof location === 'undefined') {
		throw new Error('latch: no `url` given and no `location` to infer one from')
	}

	const jar = options.jar ?? gen_document_jar()
	const url = options.url ?? new URL(location.href)
	const attributes = { path, maxAge, httpOnly, secure }
	const latched: Record<string, string | boolean | undefined> = {}

	for (const [name, spec] of Object.entries(specs)) {
		const current = jar.get(name)

		if (spec !== true && 'on' in spec) {
			let latch_on = !!current

			if (!latch_on && signalled(url, spec.on)) {
				jar.set(name, 'true', attributes)
				latch_on = true
			}

			if (latch_on && signalled(url, spec.off)) {
				jar.delete(name, { path })
				latch_on = false
			}

			latched[name] = latch_on

			continue
		}

		const fallback = spec === true ? undefined : spec[0]
		const param = url.searchParams.get(name)

		// `?name=` clears the cookie — the removal signal for both value forms.
		if (param === '') {
			if (current !== undefined) jar.delete(name, { path })

			latched[name] = fallback

			continue
		}

		const allowed = (value: string | null | undefined) =>
			value && (spec === true || spec.includes(value)) ? value : undefined
		const chosen = allowed(param)

		// Only an explicit choice persists — a first visit shouldn't write a default.
		if (chosen && chosen !== current) jar.set(name, chosen, attributes)

		latched[name] = chosen ?? allowed(current) ?? fallback
	}

	return latched as Latched<T>
}

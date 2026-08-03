import { createRequire } from 'node:module'
import type { Targets } from 'lightningcss'

/** `'baseline'` tracks the calendar, `'baseline-YYYY'` pins a year, an array is esbuild strings. */
export type TargetSpec = 'baseline' | `baseline-${number}` | string[]

type Baseline = {
	getCompatibleVersions(options?: { targetYear?: number }): Array<{ browser: string; version: string }>
}

// baseline-browser-mapping's browser ids -> esbuild target names. Its android and
// downstream entries have no esbuild equivalent, so they fall out here.
const names: Record<string, string> = {
	chrome: 'chrome',
	edge: 'edge',
	firefox: 'firefox',
	safari: 'safari',
	safari_ios: 'ios'
}

// esbuild target names -> lightningcss Targets keys. Anything else in an array spec
// (`es2022`, `esnext`, `node20`) is meaningful to esbuild alone and is skipped.
const keys: Record<string, keyof Targets> = {
	android: 'android',
	chrome: 'chrome',
	edge: 'edge',
	firefox: 'firefox',
	ie: 'ie',
	ios: 'ios_saf',
	opera: 'opera',
	safari: 'safari',
	samsung: 'samsung'
}

/** lightningcss packs versions into a single int: major, minor and patch one byte apart. */
function encode(version: string): number {
	const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number)
	return (major << 16) | (minor << 8) | patch
}

function load(): Baseline {
	try {
		return createRequire(import.meta.url)('baseline-browser-mapping')
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') throw error
		throw new Error(
			"[kitto] targets: 'baseline' needs the baseline-browser-mapping package — install it with `npm i -D baseline-browser-mapping`",
			{ cause: error }
		)
	}
}

function from_baseline(spec: string): string[] {
	const year = spec === 'baseline' ? undefined : Number(spec.slice('baseline-'.length))
	if (year !== undefined && !Number.isInteger(year))
		throw new Error(
			`[kitto] unknown targets '${spec}' — use 'baseline', 'baseline-<year>' or an array of esbuild targets`
		)

	return load()
		.getCompatibleVersions(year === undefined ? {} : { targetYear: year })
		.flatMap(({ browser, version }) => (names[browser] ? [`${names[browser]}${version}`] : []))
		.sort()
}

/**
 * @module targets
 * @group Vite
 * @version 1.0.0
 * @remarks
 * Resolves browser targets into the two encodings vite needs — esbuild-style strings for
 * `build.target`/`build.cssTarget`, and lightningcss's packed ints for
 * `css.lightningcss.targets` — from one source, so the two can't drift apart.
 *
 * `'baseline'` reads Baseline Widely Available live, which is defined as 30 months behind
 * the current date, so the floor moves on its own. Prefer `'baseline-<year>'` when builds
 * need to be reproducible: it pins the feature set to the end of that calendar year.
 *
 * Both baseline forms need the optional `baseline-browser-mapping` peer installed. An array
 * spec needs nothing and is passed to esbuild untouched.
 *
 * @param spec - `'baseline'`, `'baseline-<year>'`, or esbuild target strings.
 * @returns The same floor in both encodings.
 *
 * @example
 * ```ts
 * resolve_targets('baseline')
 * // { esbuild: ['chrome121', 'edge121', 'firefox122', 'ios17.2', 'safari17.2'], lightningcss: { chrome: 7929856, ... } }
 *
 * resolve_targets(['chrome111', 'safari16.4'])
 * // { esbuild: ['chrome111', 'safari16.4'], lightningcss: { chrome: 7274496, safari: 1074176 } }
 * ```
 */
export function resolve_targets(spec: TargetSpec): { esbuild: string[]; lightningcss: Targets } {
	const esbuild = Array.isArray(spec) ? spec : from_baseline(spec)
	const lightningcss: Targets = {}

	for (const target of esbuild) {
		const [, name, version] = /^([a-z_]+)([\d.]+)$/.exec(target) ?? []
		const key = name && keys[name]
		if (key) lightningcss[key] = encode(version)
	}

	return { esbuild, lightningcss }
}

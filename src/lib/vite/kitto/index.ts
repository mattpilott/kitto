import fs from 'node:fs'
import path from 'node:path'
import { composeVisitors, transform } from 'lightningcss'
import {
	breakpoints as breakpoints_visitor,
	fluid as fluid_visitor,
	size as size_visitor
} from '../../lightningcss/index.js'
import { deploy_env } from '../deploy_env/index.js'
import { format_date } from '../../vanilla/date/format_date/index.js'
import type { CustomAtRules, Visitor } from 'lightningcss'
import type { Plugin, UserConfig } from 'vite'

interface Options {
	/** Breakpoint map for the breakpoints visitor, e.g. `{ mobile: 640 }`. Omit to disable. */
	breakpoints?: Record<string, number>
	/** Options for the fluid visitor. Omit to disable. */
	fluid?: { vmin?: number; vmax?: number; root?: number }
	/** Enable the size shorthand visitor. On by default. */
	size?: boolean
	/** Extra lightningcss visitors, composed after kitto's. */
	visitors?: Array<Visitor<CustomAtRules>>
	/** Bake name, version, build and environment into `import.meta.env`. On by default, per key too: `{ name: false }` drops one. */
	defines?: boolean | { name?: boolean; version?: boolean; build?: boolean; environment?: boolean }
	/** Serve https when mkcert pems (`<name>.pem` + `<name>-key.pem`) exist in the project root. On by default. */
	https?: boolean
}

/**
 * @module kitto
 * @group Vite
 * @version 1.0.0
 * @remarks
 * All-in-one vite plugin for kitto projects. Configures lightningcss as the css
 * transformer with kitto's visitors, bakes `import.meta.env.name/version/build/environment`
 * into the bundle, serves https in dev when local certs are present, and silences
 * lightningcss warnings about svelte's `:global` selector.
 *
 * Under bun, lightningcss's async APIs panic when given a visitor
 * (oven-sh/bun#13771), and vite invokes lightningcss asynchronously. Until the fix
 * (oven-sh/bun#30543) ships, the plugin runs the visitors through the sync
 * transform API in a pre transform instead — projects need no workaround of their own.
 *
 * For ssl in dev, use mkcert to create trusted local certificates and drop them in
 * the project root — the plugin picks up any `<name>.pem` + `<name>-key.pem` pair:
 *
 * ```sh
 * brew install mkcert nss
 * mkcert -install
 * mkcert localhost
 * ```
 *
 * @param [options] - Plugin options.
 * @returns The vite plugin.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { kitto } from 'kitto/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     kitto({
 *       breakpoints: { mobile: 640, tablet: 1024, laptop: 1280, desktop: 1440 },
 *       fluid: { vmax: 1600 }
 *     }),
 *     sveltekit()
 *   ]
 * })
 * ```
 */
export function kitto(options: Options = {}): Plugin {
	const { breakpoints, fluid, size = true, visitors = [], defines = true, https = true } = options

	const own = [
		...(breakpoints ? [breakpoints_visitor(breakpoints)] : []),
		...(fluid ? [fluid_visitor(fluid)] : []),
		...(size ? [size_visitor] : []),
		...visitors
	]
	const own_visitor = own.length ? composeVisitors(own) : undefined

	const is_bun = !!process.versions.bun
	// TODO: once oven-sh/bun#30543 ships, gate on the fixed bun version, then delete the fallback
	const bun_fallback = is_bun && !!own_visitor

	// The fallback parse can be skipped when a file contains none of the syntax the
	// visitors rewrite. Breakpoints match on the device names so that misspelt
	// prefixes still reach the visitor and throw. Extra `visitors` are unknown
	// syntax, so they disable the shortcut.
	const needles = [
		...Object.keys(breakpoints ?? {}).map(device => `-${device}`),
		...(fluid ? ['fluid('] : []),
		...(size ? ['size'] : [])
	]

	let command = 'serve'
	let warn_https = false
	let foreign_visitor = false

	const plugin: Plugin = {
		name: 'kitto',
		enforce: 'pre',

		config(user, env) {
			command = env.command
			const root = user.root ?? process.cwd()
			const config: UserConfig = {}

			if (!user.css?.transformer || user.css.transformer === 'lightningcss') {
				config.css = { transformer: 'lightningcss' }
				const existing = user.css?.lightningcss?.visitor
				foreign_visitor = !!existing
				if (own_visitor && !bun_fallback) {
					config.css.lightningcss = {
						visitor: existing ? composeVisitors([own_visitor, existing]) : own_visitor
					}
				}
			}

			if (defines) {
				const on = (key: string) => defines === true || defines[key as keyof typeof defines] !== false
				const { name, version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
				const entries = {
					...(on('name') && { 'import.meta.env.name': JSON.stringify(name) }),
					...(on('version') && { 'import.meta.env.version': JSON.stringify(version) }),
					...(on('build') && {
						'import.meta.env.build': JSON.stringify(format_date('{DD}-{MM}-{YYYY}@{HH}:{mm}:{ss}'))
					}),
					...(on('environment') && {
						'import.meta.env.environment': JSON.stringify(deploy_env(env.command))
					})
				}
				// user-supplied entries win over kitto's
				config.define = { ...entries, ...user.define }
			}

			if (https && user.server?.https === undefined) {
				// mkcert emits <name>.pem + <name>-key.pem, whatever the domain
				const key = fs
					.readdirSync(root)
					.filter(file => file.endsWith('-key.pem'))
					.sort()
					.find(file => fs.existsSync(path.join(root, file.replace('-key.pem', '.pem'))))
				warn_https = !key
				if (key) {
					const cert = key.replace('-key.pem', '.pem')
					config.server = {
						https: {
							key: fs.readFileSync(path.join(root, key), 'utf8'),
							cert: fs.readFileSync(path.join(root, cert), 'utf8')
						}
					}
				}
			}

			return config
		},

		configResolved({ logger }) {
			const warn = logger.warn.bind(logger)
			logger.warn = (msg, opts) => {
				// lightningcss doesn't know svelte's :global selector; the css still works
				if (msg.includes('vite:css') && msg.includes("'global'")) return
				warn(msg, opts)
			}
			if (warn_https && command === 'serve')
				logger.warn(
					'[kitto] no mkcert pems found in the project root; starting without https (mkcert -install && mkcert localhost)'
				)
			if (is_bun && foreign_visitor)
				logger.warn(
					'[kitto] css.lightningcss.visitor crashes under bun (oven-sh/bun#13771) — pass it via kitto({ visitors }) instead'
				)
		}
	}

	if (bun_fallback) {
		plugin.transform = (code, id) => {
			if (!/\.css(?:$|\?)/.test(id)) return
			if (!visitors.length && !needles.some(needle => code.includes(needle))) return
			const result = transform({
				filename: id.split('?')[0],
				code: Buffer.from(code),
				visitor: own_visitor,
				sourceMap: true
			})
			return { code: result.code.toString(), map: result.map?.toString() }
		}
	}

	return plugin
}

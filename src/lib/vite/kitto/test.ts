import { describe, it, expect, vi } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { kitto } from './index.js'
import type { Plugin, UserConfig, ResolvedConfig } from 'vite'

const serve = { command: 'serve', mode: 'development' } as const
const build = { command: 'build', mode: 'production' } as const
type Env = typeof serve | typeof build

// vite hooks are `fn | { handler: fn }`; unwrap so tests can call them directly
function hook<T>(h: T | { handler: T } | undefined | null): T {
	if (!h) throw new Error('hook not defined')
	return typeof h === 'object' && 'handler' in h ? h.handler : h
}

function config_of(plugin: Plugin, user: UserConfig = {}, env: Env = build) {
	return (hook(plugin.config) as unknown as (user: UserConfig, env: Env) => UserConfig)(user, env)
}

function resolve_config(plugin: Plugin, config: ResolvedConfig) {
	hook(plugin.configResolved)?.call(null as never, config)
}

function with_bun<T>(fn: () => T): T {
	Object.defineProperty(process.versions, 'bun', { value: '1.3.0', configurable: true })
	try {
		return fn()
	} finally {
		delete (process.versions as Record<string, unknown>).bun
	}
}

function resolved(overrides: Partial<ResolvedConfig> = {}) {
	return { logger: { warn: vi.fn() }, ...overrides } as unknown as ResolvedConfig
}

const options = { breakpoints: { tablet: 1024 }, fluid: { vmax: 1600 }, https: false }

describe('kitto plugin', () => {
	describe('css', () => {
		it('configures lightningcss with a composed visitor', () => {
			const config = config_of(kitto(options))
			expect(config.css?.transformer).toBe('lightningcss')
			expect(config.css?.lightningcss?.visitor).toBeDefined()
		})

		it('leaves css alone when the user chose another transformer', () => {
			const config = config_of(kitto(options), { css: { transformer: 'postcss' } })
			expect(config.css).toBeUndefined()
		})

		it('has no transform hook outside bun', () => {
			expect(kitto(options).transform).toBeUndefined()
		})
	})

	describe('bun fallback', () => {
		it('skips the native visitor and adds a transform hook', () => {
			const plugin = with_bun(() => kitto(options))
			expect(config_of(plugin).css?.lightningcss).toBeUndefined()
			expect(plugin.transform).toBeDefined()
		})

		it('rewrites kitto syntax through the sync transform', () => {
			const plugin = with_bun(() => kitto(options))
			const run = plugin.transform as (code: string, id: string) => { code: string; map?: string } | undefined
			const result = run(
				'@media (--from-tablet) { a { size: 2rem; font-size: fluid(1rem, 2rem); } } @media (--until-tablet) { a { color: red } }',
				'app.css'
			)
			expect(result?.code).toContain('width >= 64em')
			expect(result?.code).toContain('width <= 63.9375em')
			expect(result?.code).toContain('height: 2rem')
			expect(result?.code).toContain('width: 2rem')
			expect(result?.code).toContain('clamp(1rem')
			expect(result?.map).toBeDefined()
		})

		it('throws loudly on a misspelt breakpoint prefix', () => {
			const plugin = with_bun(() => kitto(options))
			const run = plugin.transform as (code: string, id: string) => unknown
			expect(() => run('@media (--till-tablet) { a { color: red } }', 'app.css')).toThrow(
				/use \(--from-tablet\) for min-width, \(--until-tablet\) for max-width or \(--only-tablet\) for just that range/
			)
		})

		it('skips files without kitto syntax and non-css files', () => {
			const plugin = with_bun(() => kitto(options))
			const run = plugin.transform as (code: string, id: string) => unknown
			expect(run('a { color: red }', 'app.css')).toBeUndefined()
			expect(run('const size = 1', 'app.ts')).toBeUndefined()
		})

		it('warns when a visitor is passed outside the plugin', () => {
			const plugin = with_bun(() => kitto(options))
			config_of(plugin, { css: { lightningcss: { visitor: {} } } })
			const config = resolved()
			const warn = config.logger.warn
			resolve_config(plugin, config)
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('oven-sh/bun#13771'), undefined)
		})
	})

	describe('targets', () => {
		it('leaves build alone when omitted', () => {
			const config = config_of(kitto(options))
			expect(config.build).toBeUndefined()
			expect(config.css?.lightningcss?.targets).toBeUndefined()
		})

		it('sets js, css and minify floors from one source', () => {
			const config = config_of(kitto({ ...options, targets: ['chrome111', 'safari16.4'] }))
			expect(config.build?.target).toEqual(['chrome111', 'safari16.4'])
			expect(config.build?.cssTarget).toEqual(['chrome111', 'safari16.4'])
			expect(config.css?.lightningcss?.targets).toEqual({ chrome: 111 << 16, safari: (16 << 16) | (4 << 8) })
		})

		it('keeps the visitor alongside the targets', () => {
			const config = config_of(kitto({ ...options, targets: 'baseline' }))
			expect(config.css?.lightningcss?.visitor).toBeDefined()
			expect(config.css?.lightningcss?.targets).toBeDefined()
		})

		it('tracks baseline widely available', () => {
			const config = config_of(kitto({ ...options, targets: 'baseline' }))
			expect(config.build?.target).toEqual(expect.arrayContaining([expect.stringMatching(/^safari\d/)]))
		})

		it('lets an explicit build.target win', () => {
			const user = { build: { target: ['chrome99'] } }
			const config = config_of(kitto({ ...options, targets: 'baseline' }), user)
			expect(config.build?.target).toEqual(['chrome99'])
			expect(config.build?.cssTarget).toEqual(['chrome99'])
		})

		it('lets an explicit cssTarget diverge from build.target', () => {
			const user = { build: { target: ['chrome111'], cssTarget: ['chrome99'] } }
			const config = config_of(kitto({ ...options, targets: 'baseline' }), user)
			expect(config.build?.target).toEqual(['chrome111'])
			expect(config.build?.cssTarget).toEqual(['chrome99'])
		})

		it('lets explicit lightningcss targets win', () => {
			const user = { css: { lightningcss: { targets: { chrome: 99 << 16 } } } }
			const config = config_of(kitto({ ...options, targets: 'baseline' }), user)
			expect(config.css?.lightningcss?.targets).toEqual({ chrome: 99 << 16 })
		})

		it('still sets the minify floor under postcss', () => {
			const user = { css: { transformer: 'postcss' } } as const
			const config = config_of(kitto({ ...options, targets: ['chrome111'] }), user)
			expect(config.css).toBeUndefined()
			expect(config.build?.cssTarget).toEqual(['chrome111'])
		})
	})

	describe('defines', () => {
		it('bakes name, version, build and environment', () => {
			const config = config_of(kitto(options), { root: import.meta.dirname + '/../../../..' }, serve)
			expect(config.define?.['import.meta.env.name']).toBe('"kitto"')
			expect(config.define?.['import.meta.env.version']).toMatch(/^"\d+\.\d+\.\d+"$/)
			expect(config.define?.['import.meta.env.build']).toMatch(/^"\d{2}-\d{2}-\d{4}@/)
			expect(config.define?.['import.meta.env.environment']).toBe('"development"')
		})

		it('lets user defines win', () => {
			const user = { define: { 'import.meta.env.name': '"custom"' } }
			const config = config_of(kitto(options), user)
			expect(config.define?.['import.meta.env.name']).toBe('"custom"')
		})

		it('can be disabled', () => {
			const config = config_of(kitto({ ...options, defines: false }))
			expect(config.define).toBeUndefined()
		})

		it('can be disabled per key', () => {
			const config = config_of(kitto({ ...options, defines: { name: false, build: false } }))
			expect(config.define?.['import.meta.env.name']).toBeUndefined()
			expect(config.define?.['import.meta.env.build']).toBeUndefined()
			expect(config.define?.['import.meta.env.version']).toBeDefined()
			expect(config.define?.['import.meta.env.environment']).toBeDefined()
		})
	})

	describe('https', () => {
		it('serves https from any mkcert pem pair', () => {
			const root = mkdtempSync(join(tmpdir(), 'kitto-'))
			writeFileSync(join(root, 'myapp.test+1-key.pem'), 'key')
			writeFileSync(join(root, 'myapp.test+1.pem'), 'cert')
			writeFileSync(join(root, 'package.json'), '{"name":"x","version":"0.0.0"}')
			const config = config_of(kitto({ ...options, https: true }), { root })
			expect(config.server?.https).toEqual({ key: 'key', cert: 'cert' })
		})

		it('ignores a key without its sibling cert', () => {
			const root = mkdtempSync(join(tmpdir(), 'kitto-'))
			writeFileSync(join(root, 'localhost-key.pem'), 'key')
			writeFileSync(join(root, 'package.json'), '{"name":"x","version":"0.0.0"}')
			const config = config_of(kitto({ ...options, https: true }), { root })
			expect(config.server).toBeUndefined()
		})

		it('warns in dev when certs are missing', () => {
			const root = mkdtempSync(join(tmpdir(), 'kitto-'))
			writeFileSync(join(root, 'package.json'), '{"name":"x","version":"0.0.0"}')
			const plugin = kitto({ ...options, https: true })
			expect(config_of(plugin, { root }, serve).server).toBeUndefined()
			const config = resolved()
			const warn = config.logger.warn
			resolve_config(plugin, config)
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('no mkcert pems found'), undefined)
		})
	})

	describe('logger', () => {
		it("silences vite:css 'global' warnings, passes others through", () => {
			const plugin = kitto(options)
			config_of(plugin)
			const config = resolved()
			const warn = config.logger.warn
			resolve_config(plugin, config)
			config.logger.warn("[vite:css] unknown pseudo class 'global'", { timestamp: true })
			expect(warn).not.toHaveBeenCalled()
			config.logger.warn('[vite:css] something else')
			expect(warn).toHaveBeenCalledWith('[vite:css] something else', undefined)
		})
	})
})

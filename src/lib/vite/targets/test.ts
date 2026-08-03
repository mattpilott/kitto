import { describe, it, expect } from 'vitest'
import { resolve_targets } from './index.js'

describe('resolve_targets', () => {
	describe('array spec', () => {
		it('passes esbuild targets through untouched', () => {
			expect(resolve_targets(['chrome111', 'safari16.4']).esbuild).toEqual(['chrome111', 'safari16.4'])
		})

		it('packs versions into lightningcss ints', () => {
			// lightningcss lays out major, minor and patch one byte apart
			expect(resolve_targets(['chrome111']).lightningcss).toEqual({ chrome: 111 << 16 })
			expect(resolve_targets(['safari16.4']).lightningcss).toEqual({ safari: (16 << 16) | (4 << 8) })
			expect(resolve_targets(['ios17.2.1']).lightningcss).toEqual({ ios_saf: (17 << 16) | (2 << 8) | 1 })
		})

		it('maps ios to lightningcss ios_saf', () => {
			expect(resolve_targets(['ios17.2']).lightningcss).toEqual({ ios_saf: (17 << 16) | (2 << 8) })
		})

		it('keeps esbuild-only targets out of the lightningcss encoding', () => {
			const { esbuild, lightningcss } = resolve_targets(['es2022', 'esnext', 'node20', 'chrome111'])
			expect(esbuild).toContain('es2022')
			expect(lightningcss).toEqual({ chrome: 111 << 16 })
		})
	})

	describe('baseline spec', () => {
		it('returns the core browsers in both encodings', () => {
			const { esbuild, lightningcss } = resolve_targets('baseline')

			expect(esbuild).toEqual(
				expect.arrayContaining([
					expect.stringMatching(/^chrome\d/),
					expect.stringMatching(/^edge\d/),
					expect.stringMatching(/^firefox\d/),
					expect.stringMatching(/^ios\d/),
					expect.stringMatching(/^safari\d/)
				])
			)
			expect(Object.keys(lightningcss).sort()).toEqual(['chrome', 'edge', 'firefox', 'ios_saf', 'safari'])
		})

		it('agrees between the two encodings', () => {
			const { esbuild, lightningcss } = resolve_targets('baseline')
			const chrome = Number(esbuild.find(t => t.startsWith('chrome'))!.slice('chrome'.length))

			expect(lightningcss.chrome).toBe(chrome << 16)
		})

		it('pins a year feature set', () => {
			// 2024 closes with light-dark(), so safari can be no lower than 17.5
			const { esbuild } = resolve_targets('baseline-2024')
			const safari = esbuild.find(t => t.startsWith('safari'))!

			expect(Number(safari.slice('safari'.length))).toBeGreaterThanOrEqual(17.5)
		})

		it('is stable across calls', () => {
			expect(resolve_targets('baseline-2024')).toEqual(resolve_targets('baseline-2024'))
		})

		it('tracks the calendar, so baseline sits below a later year set', () => {
			const of = (spec: 'baseline' | 'baseline-2024') =>
				Number(
					resolve_targets(spec)
						.esbuild.find(t => t.startsWith('chrome'))!
						.slice('chrome'.length)
				)

			expect(of('baseline')).toBeLessThan(of('baseline-2024'))
		})

		it('throws on a malformed spec', () => {
			expect(() => resolve_targets('baseline-latest' as 'baseline')).toThrow(/unknown targets/)
		})
	})
})

import { describe, it, expect } from 'vitest'
import { transform } from 'lightningcss'
import { breakpoints } from './index.js'

describe('breakpoints function', () => {
	const visitor = breakpoints({ sm: 640, md: 768, lg: 1024, xl: 1280 })

	/** Runs a media query through lightningcss and returns the prelude it printed */
	const media = (query: string, targets?: Record<string, number>) =>
		transform({
			filename: 'test.css',
			code: Buffer.from(`@media ${query} { .a { color: red } }`),
			minify: true,
			visitor,
			targets
		})
			.code.toString()
			.slice('@media '.length, -'{.a{color:red}}'.length)

	it('should generate media query for custom breakpoints', () => {
		expect(media('(--from-md)')).toBe('(width>=48em)')
		expect(media('(--until-lg)')).toBe('(width<=63.9375em)')
	})

	it('should handle multiple conditions', () => {
		expect(media('(--from-md) and (--until-lg)')).toBe('(width>=48em) and (width<=63.9375em)')
		expect(media('(--from-md), (--until-sm)')).toBe('(width>=48em),(width<=39.9375em)')
	})

	it('should generate a range for --only-', () => {
		expect(media('(--only-md)')).toBe('(width>=48em) and (width<=63.9375em)')
	})

	it('should leave --only- open-ended on the largest breakpoint', () => {
		expect(media('(--only-xl)')).toBe('(width>=80em)')
	})

	it('should keep the media type and qualifier', () => {
		expect(media('screen and (--from-md)')).toBe('screen and (width>=48em)')
		expect(media('print and (--from-md)')).toBe('print and (width>=48em)')
		expect(media('only screen and (--from-md)')).toBe('only screen and (width>=48em)')
		expect(media('not screen and (--from-md)')).toBe('not screen and (width>=48em)')
	})

	it('should handle a negated breakpoint', () => {
		expect(media('not (--from-md)')).toBe('(width<48em)')
	})

	it('should handle breakpoints mixed with ordinary features', () => {
		expect(media('(--from-md) and (hover: hover)')).toBe('(width>=48em) and (hover:hover)')
		expect(media('(orientation: landscape) and (--from-md)')).toBe('(orientation:landscape) and (width>=48em)')
	})

	it('should handle breakpoints nested in a group', () => {
		expect(media('((--from-md) or (--until-sm)) and (hover: hover)')).toBe(
			'((width>=48em) or (width<=39.9375em)) and (hover:hover)'
		)
	})

	it('should lower to min-/max-width for older targets', () => {
		expect(media('screen and (--only-md)', { chrome: 70 << 16 })).toBe(
			'screen and (min-width:48em) and (max-width:63.9375em)'
		)
	})

	it('should be idempotent', () => {
		expect(media(media('(--from-md) and (hover: hover)'))).toBe('(width>=48em) and (hover:hover)')
	})

	it('should support breakpoint names containing hyphens', () => {
		const hyphenated = breakpoints({ 'large-desktop': 1600 })
		const out = transform({
			filename: 'test.css',
			code: Buffer.from('@media (--from-large-desktop) { .a { color: red } }'),
			minify: true,
			visitor: hyphenated
		}).code.toString()

		expect(out).toBe('@media (width>=100em){.a{color:red}}')
	})

	it('should throw on an unknown prefix, showing the correct syntax', () => {
		expect(() => media('(--to-lg)')).toThrow(
			'[kitto] unknown breakpoint query (--to-lg); use (--from-lg) for min-width, (--until-lg) for max-width or (--only-lg) for just that range'
		)
	})

	it('should throw on a missing prefix, showing the correct syntax', () => {
		expect(() => media('(--lg)')).toThrow(
			'use (--from-lg) for min-width, (--until-lg) for max-width or (--only-lg) for just that range'
		)
	})

	it('should throw even when the typo sits alongside other conditions', () => {
		expect(() => media('(hover: hover) and (--to-lg)')).toThrow('[kitto] unknown breakpoint query (--to-lg)')
	})

	it('should leave unrelated custom media queries alone', () => {
		expect(media('(--unknown)')).toBe('(--unknown)')
		expect(media('(--unknown) and (--from-md)')).toBe('(--unknown) and (width>=48em)')
	})

	it('should leave ordinary media queries alone', () => {
		expect(media('print')).toBe('print')
		expect(media('(min-width: 48em)')).toBe('(width>=48em)')
	})
})

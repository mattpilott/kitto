import { describe, it, expect } from 'vitest'
import { composeVisitors, transform } from 'lightningcss'
import { breakpoints, fluid, size } from './index.js'

// Vite spreads `css.lightningcss` into its minify pass as well as the transform, so on node
// the composed visitor sees the css a second time (vitejs/vite#23146). That is only harmless
// while the visitors are a fixed point — this locks that in.
describe('visitors are idempotent', () => {
	const visitor = composeVisitors([breakpoints({ tablet: 1024 }), fluid({ vmax: 1600 }), size])

	const run = (css: string, seen = visitor) =>
		transform({ filename: 'test.css', code: Buffer.from(css), visitor: seen }).code.toString()

	// lightningcss normalises calc expressions and declaration order on every pass, so a
	// second transform is not byte-identical to the first whether a visitor is attached or
	// not. What matters is narrower: on that second pass the visitor contributes nothing.
	const plain = (css: string) => run(css, undefined)

	const cases = {
		breakpoints: '@media (--from-tablet) { a { color: red } } @media (--until-tablet) { a { color: blue } }',
		fluid: 'a { font-size: fluid(1rem, 2rem) }',
		size: 'a { size: 2rem } b { size: 50% auto }',
		combined: '@media (--only-tablet) { a { size: fluid(1rem, 2rem) } }'
	}

	for (const [name, css] of Object.entries(cases))
		it(`${name} is fully consumed in one pass`, () => {
			const once = run(css)
			expect(run(once)).toBe(plain(once))
		})

	it('consumes the kitto syntax in the first pass', () => {
		// guards the cases above against passing simply because nothing ever matched
		for (const css of Object.values(cases))
			expect(run(css)).not.toMatch(/fluid\(|--from-|--until-|--only-|[^-]size:/)
	})
})

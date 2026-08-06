import { describe, it, expect } from 'vitest'
import { composeVisitors, transform } from 'lightningcss'
import { breakpoints, fluid, size } from './index.js'

// Vite ≤8.2.0 spread `css.lightningcss` into its minify pass as well as the transform, so the
// composed visitor saw the css twice (vitejs/vite#23146, fixed in 8.2.1). Kept because kitto
// still supports those versions, and because a visitor that is not a fixed point is a bug in
// its own right — anything it rewrites should already be plain css by the time it returns.
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

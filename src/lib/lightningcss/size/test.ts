import { describe, it, expect } from 'vitest'
import { transform } from 'lightningcss'
import { size } from './index.js'

const run = (css: string) =>
	transform({ filename: 'test.css', code: Buffer.from(css), visitor: size, minify: true }).code.toString()

describe('size visitor', () => {
	it('converts size: 100px to height and width', () => {
		expect(run('div { size: 100px; }')).toBe('div{height:100px;width:100px}')
	})

	it('converts size: 100px 200px to separate height and width', () => {
		expect(run('div { size: 100px 200px; }')).toBe('div{height:100px;width:200px}')
	})

	it('supports percentages', () => {
		expect(run('div { size: 50%; }')).toBe('div{height:50.0%;width:50.0%}')
	})

	it('supports any unit', () => {
		expect(run('div { size: 2em 50vh; }')).toBe('div{height:2em;width:50vh}')
	})

	it('supports css variables', () => {
		expect(run('div { size: var(--s); }')).toBe('div{height:var(--s);width:var(--s)}')
	})

	it('supports css variables with fallbacks', () => {
		expect(run('div { size: var(--h, 4rem) var(--w); }')).toBe('div{height:var(--h,4rem);width:var(--w)}')
	})

	it('supports calc and math functions', () => {
		expect(run('div { size: calc(100% - 2rem) min(50vw, 300px); }')).toBe(
			'div{height:calc(100.0% - 2rem);width:min(50vw, 300px)}'
		)
	})

	it('supports keywords', () => {
		expect(run('div { size: auto; }')).toBe('div{height:auto;width:auto}')
	})

	it('throws for more than two values', () => {
		expect(() => run('div { size: 1px 2px 3px; }')).toThrowError(
			'size accepts at most two values: `size: <height> <width>?`'
		)
	})
})

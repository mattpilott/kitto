/* Imports */
import { bench } from 'vitest'
import { slider } from './index.js'
import 'global-jsdom/register'

/* Setup */
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver

// Node has its own CustomEvent, which jsdom's dispatchEvent rejects as a foreign Event
globalThis.CustomEvent = window.CustomEvent

function build(count: number) {
	const el = document.createElement('div')

	for (let i = 0; i < count; i++) el.append(document.createElement('div'))
	document.body.append(el)

	return el
}

const small = build(5)
const large = build(50)
const looped = build(50)
const reel = slider(build(50))

/* Benchmark */
bench('slider init (5 slides)', () => {
	slider(small).destroy()
})

bench('slider init (50 slides)', () => {
	slider(large).destroy()
})

bench('slider init (50 slides, looping)', () => {
	slider(looped, { loop: true, per_page: 3 }).destroy()
})

bench('slider next', () => {
	reel.next()
})

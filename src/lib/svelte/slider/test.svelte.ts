import { describe, it, expect, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import { slider } from './index.svelte.js'
import type { SliderOptions } from '../../vanilla/dom/slider/index.js'

afterEach(() => {
	document.body.replaceChildren()
})

function mount(count = 5, options: SliderOptions = {}) {
	const el = document.createElement('div')

	for (let i = 0; i < count; i++) {
		const slide = document.createElement('div')
		slide.textContent = `slide ${i}`
		el.append(slide)
	}

	document.body.append(el)

	const reel = slider(options)
	const teardown = reel.attach(el) as () => void

	return { el, reel, teardown }
}

/**
 * Swap in a ResizeObserver a test can drive. The setup file's stub never fires, and jsdom has
 * no layout to fire it from, so the resize path would otherwise never run.
 */
function observing() {
	const callbacks: Array<() => void> = []
	const original = window.ResizeObserver

	window.ResizeObserver = class {
		constructor(callback: () => void) {
			callbacks.push(callback)
		}
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver

	return {
		/** Resize the viewport and let the observer react. */
		to(width: number) {
			window.innerWidth = width
			for (const callback of callbacks) callback()
		},
		restore() {
			window.ResizeObserver = original
			window.innerWidth = 1024
		}
	}
}

/** Record every value an effect sees, so reactivity can be asserted rather than assumed. */
function track<T>(read: () => T) {
	const seen: T[] = []
	const stop = $effect.root(() => {
		$effect(() => {
			seen.push(read())
		})
	})

	flushSync()

	return { seen, stop }
}

describe('slider controller', () => {
	describe('state', () => {
		it('syncs from the slider once attached', () => {
			const { reel } = mount(5)

			expect(reel.index).toBe(0)
			expect(reel.length).toBe(5)
			expect(reel.per_page).toBe(1)
		})

		it('reports start_index before the element mounts', () => {
			const reel = slider({ start_index: 3 })

			expect(reel.index).toBe(3)
			expect(reel.length).toBe(0)
		})

		it('picks up per_page from a breakpoint map', () => {
			// jsdom reports innerWidth 1024
			expect(mount(9, { per_page: { 0: 1, 640: 2, 1024: 3 } }).reel.per_page).toBe(3)
		})
	})

	describe('reactivity', () => {
		it('re-runs effects reading index', () => {
			const { reel } = mount(5)
			const { seen, stop } = track(() => reel.index)

			expect(seen).toEqual([0])

			reel.next()
			flushSync()
			expect(seen).toEqual([0, 1])

			reel.go_to(4)
			flushSync()
			expect(seen).toEqual([0, 1, 4])

			stop()
		})

		it('re-runs effects reading length when slides change', () => {
			const { reel } = mount(3)
			const { seen, stop } = track(() => reel.length)

			expect(seen).toEqual([3])

			reel.append(document.createElement('div'))
			flushSync()
			expect(seen).toEqual([3, 4])

			reel.remove(0)
			flushSync()
			expect(seen).toEqual([3, 4, 3])

			stop()
		})

		it('syncs from changes it did not initiate', () => {
			const { el, reel } = mount(5)
			const { seen, stop } = track(() => reel.index)

			// Driven through the DOM, so this only works if sliderchange is wired up
			el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
			flushSync()

			expect(reel.index).toBe(1)
			expect(seen).toEqual([0, 1])

			stop()
		})

		it('picks up a resize that moves nothing but the geometry', () => {
			const observer = observing()
			const { reel } = mount(9, { per_page: { 0: 1, 1024: 3 } })
			const { seen, stop } = track(() => reel.per_page)

			// Driven through the observer, so this only works if sliderresize is wired up
			observer.to(500)
			flushSync()

			expect(seen).toEqual([3, 1])
			expect(reel.max).toBe(8)

			stop()
			observer.restore()
		})

		it('does not re-run when the index is unchanged', () => {
			const { reel } = mount(5)
			const { seen, stop } = track(() => reel.index)

			reel.prev()
			flushSync()

			expect(seen).toEqual([0])

			stop()
		})
	})

	describe('edges', () => {
		it('reports at_start and at_end', () => {
			const { reel } = mount(5)

			expect(reel.at_start).toBe(true)
			expect(reel.at_end).toBe(false)

			reel.next()
			expect(reel.at_start).toBe(false)

			reel.go_to(4)
			expect(reel.at_end).toBe(true)
		})

		it('accounts for per_page at the end', () => {
			const { reel } = mount(5, { per_page: 2 })

			reel.go_to(3)

			expect(reel.at_end).toBe(true)
		})

		it('is never at an edge when looping', () => {
			const { reel } = mount(5, { loop: true })

			expect(reel.at_start).toBe(false)
			expect(reel.at_end).toBe(false)

			reel.go_to(4)
			expect(reel.at_end).toBe(false)
		})

		it('sits at both edges when every slide is visible', () => {
			const { reel } = mount(2, { per_page: 2 })

			expect(reel.at_start).toBe(true)
			expect(reel.at_end).toBe(true)
		})

		it('reports the reachable maximum', () => {
			expect(mount(5, { per_page: 2 }).reel.max).toBe(3)
			expect(mount(5, { per_page: 2, pad: true }).reel.max).toBe(4)
		})

		it('holds off at_end until the last slide when padding', () => {
			const { reel } = mount(5, { per_page: 2, pad: true })

			reel.go_to(3)
			expect(reel.at_end).toBe(false)

			reel.go_to(4)
			expect(reel.at_end).toBe(true)
		})
	})

	describe('methods', () => {
		it('does nothing before the element mounts', () => {
			const reel = slider()

			expect(() => {
				reel.next()
				reel.prev()
				reel.go_to(2)
				reel.append(document.createElement('div'))
				reel.remove(0)
				reel.play()
				reel.pause()
				reel.update()
			}).not.toThrow()

			expect(reel.index).toBe(0)
			expect(reel.length).toBe(0)
		})

		it('inserts and removes slides', () => {
			const { el, reel } = mount(3)
			const item = document.createElement('div')
			item.textContent = 'added'

			reel.prepend(item)
			expect(reel.length).toBe(4)
			expect(el.firstElementChild?.firstElementChild?.textContent).toBe('added')

			reel.remove(0)
			expect(reel.length).toBe(3)
		})
	})

	describe('teardown', () => {
		it('destroys the slider and restores the markup', () => {
			const { el, reel, teardown } = mount(3)

			expect(el.children).toHaveLength(1)

			teardown()

			expect(el.children).toHaveLength(3)
			expect(el.children[0].textContent).toBe('slide 0')
			expect(el.hasAttribute('role')).toBe(false)
			expect(reel.index).toBe(0)
		})

		it('leaves the methods harmless afterwards', () => {
			const { reel, teardown } = mount(5)

			reel.next()
			teardown()

			expect(() => reel.next()).not.toThrow()
			expect(reel.index).toBe(1)
		})

		it('stops listening after teardown', () => {
			const { el, reel, teardown } = mount(5)

			teardown()
			el.dispatchEvent(new CustomEvent('sliderchange', { detail: { index: 3 } }))

			expect(reel.index).toBe(0)
		})
	})
})

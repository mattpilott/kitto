import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { slider, type SliderOptions } from './index.js'

const WIDTH = 600

/** jsdom has no layout engine, so the track always measures zero without this. */
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => WIDTH })
})

/**
 * Stand in for the reduced-motion query, keeping hold of its listeners so a test can change
 * the preference after the fact. `clearMocks` clears calls but not return values, so the
 * override has to be undone by hand.
 */
function set_reduced(matches: boolean) {
	const listeners: Array<() => void> = []
	const query = {
		matches,
		media: '(prefers-reduced-motion: reduce)',
		onchange: null,
		addEventListener: (_: string, listener: () => void) => listeners.push(listener),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}

	vi.mocked(window.matchMedia).mockReturnValue(query as unknown as MediaQueryList)

	return {
		/** Change the preference and notify, the way the browser would. */
		change(value: boolean) {
			query.matches = value
			for (const listener of listeners) listener()
		}
	}
}

afterEach(() => {
	document.body.replaceChildren()
	vi.useRealTimers()
	set_reduced(false)
	window.innerWidth = 1024
	Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
})

/**
 * Swap in a ResizeObserver a test can drive. The setup file's stub never fires, and jsdom
 * has no layout to fire it from, so the resize path would otherwise never run.
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
		}
	}
}

function setup(count = 5, options: SliderOptions = {}) {
	const el = document.createElement('div')

	for (let i = 0; i < count; i++) {
		const slide = document.createElement('div')
		slide.textContent = `slide ${i}`
		el.append(slide)
	}

	document.body.append(el)

	const instance = slider(el, options)

	return { el, instance, track: el.firstElementChild as HTMLElement }
}

function pointer(el: HTMLElement, type: string, x: number, y = 0) {
	el.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: x, clientY: y, button: 0, bubbles: true }))
}

function drag(el: HTMLElement, distance: number) {
	pointer(el, 'pointerdown', 0)
	pointer(el, 'pointermove', distance)
	pointer(el, 'pointerup', distance)
}

/** Hide or show the tab, the way switching away from it would. */
function set_hidden(hidden: boolean) {
	Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
	document.dispatchEvent(new Event('visibilitychange'))
}

function key(el: HTMLElement, name: string) {
	el.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }))
}

function wheel(el: HTMLElement, x: number, y = 0) {
	const event = new WheelEvent('wheel', { deltaX: x, deltaY: y, bubbles: true, cancelable: true })
	el.dispatchEvent(event)
	return event
}

/** Run past the idle window that ends a wheel gesture, so it settles. */
function settle_wheel() {
	vi.advanceTimersByTime(200)
}

// The vanilla suite is picked up by both the jsdom and node vitest projects; only the former can run it.
describe.skipIf(typeof window === 'undefined')('slider', () => {
	describe('init', () => {
		it('wraps the children in a single flex track', () => {
			const { el, track } = setup(3)

			expect(el.children).toHaveLength(1)
			expect(track.style.display).toBe('flex')
			expect(track.children).toHaveLength(3)
			expect(track.children[0].textContent).toBe('slide 0')
		})

		it('does not wrap individual slides', () => {
			const { track } = setup(3)

			for (const slide of track.children) expect(slide.textContent).toMatch(/^slide \d$/)
		})

		it('marks up the carousel region', () => {
			const { el } = setup(3, { label: 'Products' })

			expect(el.getAttribute('role')).toBe('region')
			expect(el.getAttribute('aria-roledescription')).toBe('carousel')
			expect(el.getAttribute('aria-label')).toBe('Products')
			expect(el.getAttribute('tabindex')).toBe('0')
		})

		it('labels each slide positionally', () => {
			const { track } = setup(3)

			expect(track.children[0].getAttribute('role')).toBe('group')
			expect(track.children[0].getAttribute('aria-roledescription')).toBe('slide')
			expect(track.children[0].getAttribute('aria-label')).toBe('1 of 3')
			expect(track.children[2].getAttribute('aria-label')).toBe('3 of 3')
		})

		it('exposes per_page through a custom property', () => {
			const { el } = setup(5, { per_page: 2 })

			expect(el.style.getPropertyValue('--slider-per-page')).toBe('2')
		})

		it('hides overflow and allows vertical panning', () => {
			const { el } = setup(3)

			expect(el.style.overflow).toBe('hidden')
			expect(el.style.touchAction).toBe('pan-y')
			expect(el.style.cursor).toBe('grab')
		})

		it('announces changes politely only when not autoplaying', () => {
			expect(setup(3).track.getAttribute('aria-live')).toBe('polite')
			expect(setup(3, { autoplay: 1000 }).track.getAttribute('aria-live')).toBeNull()
		})

		it('omits the tab stop when keyboard navigation is off', () => {
			expect(setup(3, { keyboard: false }).el.getAttribute('tabindex')).toBeNull()
		})

		it('honours start_index', () => {
			expect(setup(5, { start_index: 3 }).instance.index).toBe(3)
		})

		it('clamps start_index to the last full page', () => {
			expect(setup(5, { start_index: 99, per_page: 2 }).instance.index).toBe(3)
		})

		it('dispatches sliderinit on a microtask so late listeners still see it', async () => {
			const el = document.createElement('div')
			el.append(document.createElement('div'), document.createElement('div'))
			document.body.append(el)

			const listener = vi.fn()
			slider(el)
			el.addEventListener('sliderinit', listener)

			expect(listener).not.toHaveBeenCalled()
			await Promise.resolve()
			expect(listener).toHaveBeenCalledOnce()
			expect(listener.mock.calls[0][0].detail).toEqual({ index: 0, per_page: 1, length: 2 })
		})

		it('throws when the selector matches nothing', () => {
			expect(() => slider('.nope')).toThrow(/no element matches/)
		})

		it('accepts a selector string', () => {
			const el = document.createElement('div')
			el.className = 'reel'
			el.append(document.createElement('div'))
			document.body.append(el)

			expect(() => slider('.reel')).not.toThrow()
		})
	})

	describe('navigation', () => {
		it('advances and reports the change', () => {
			const { el, instance } = setup(5)
			const listener = vi.fn()
			el.addEventListener('sliderchange', listener)

			instance.next()

			expect(instance.index).toBe(1)
			expect(listener).toHaveBeenCalledOnce()
			expect(listener.mock.calls[0][0].detail).toEqual({ index: 1, previous: 0, per_page: 1 })
		})

		it('translates the track by the slide width', () => {
			const { instance, track } = setup(5)

			instance.next()

			expect(track.style.transform).toBe(`translate3d(${-WIDTH}px, 0, 0)`)
		})

		it('advances by a count', () => {
			const { instance } = setup(5)

			instance.next(3)

			expect(instance.index).toBe(3)
		})

		it('treats a stray event argument as a single step', () => {
			const { instance } = setup(5)

			// What happens if next is passed straight to an event listener
			;(instance.next as (value: unknown) => void)(new MouseEvent('click'))
			expect(instance.index).toBe(1)
			;(instance.prev as (value: unknown) => void)(new MouseEvent('click'))
			expect(instance.index).toBe(0)
		})

		it('ignores a non-finite step count', () => {
			const { instance } = setup(5)

			instance.next(Number.NaN)
			expect(instance.index).toBe(1)

			instance.next(Number.POSITIVE_INFINITY)
			expect(instance.index).toBe(2)
		})

		it('stops at the last full page', () => {
			const { instance } = setup(5, { per_page: 2 })

			instance.next(99)

			expect(instance.index).toBe(3)
		})

		it('stops at the first slide', () => {
			const { instance } = setup(5, { start_index: 1 })

			instance.prev(99)

			expect(instance.index).toBe(0)
		})

		it('stays silent when nothing moves', () => {
			const { el, instance } = setup(5)
			const listener = vi.fn()
			el.addEventListener('sliderchange', listener)

			instance.prev()

			expect(instance.index).toBe(0)
			expect(listener).not.toHaveBeenCalled()
		})

		it('does nothing when every slide is already visible', () => {
			const { instance } = setup(2, { per_page: 2 })

			instance.next()

			expect(instance.index).toBe(0)
		})

		it('jumps to an index', () => {
			const { instance } = setup(5)

			instance.go_to(4)

			expect(instance.index).toBe(4)
		})

		it('clamps a jump beyond the end', () => {
			const { instance } = setup(5)

			instance.go_to(99)
			expect(instance.index).toBe(4)

			instance.go_to(-99)
			expect(instance.index).toBe(0)
		})

		it('translates in the opposite direction when rtl', () => {
			const { instance, track } = setup(5, { rtl: true })

			instance.next()

			expect(track.style.direction).toBe('rtl')
			expect(track.style.transform).toBe(`translate3d(${WIDTH}px, 0, 0)`)
		})
	})

	describe('per_page breakpoints', () => {
		it('picks the widest matching breakpoint', () => {
			// jsdom reports innerWidth 1024
			expect(setup(9, { per_page: { 0: 1, 640: 2, 1024: 3 } }).instance.per_page).toBe(3)
		})

		it('is insensitive to key order', () => {
			expect(setup(9, { per_page: { 1024: 3, 0: 1, 640: 2 } }).instance.per_page).toBe(3)
		})

		it('ignores breakpoints above the viewport', () => {
			expect(setup(9, { per_page: { 0: 1, 2560: 4 } }).instance.per_page).toBe(1)
		})

		it('limits the reachable index to the resolved page size', () => {
			const { instance } = setup(5, { per_page: { 0: 3 } })

			instance.next(99)

			expect(instance.index).toBe(2)
		})
	})

	describe('resizing', () => {
		it('re-resolves per_page as the viewport changes', () => {
			const observer = observing()
			const { instance } = setup(9, { per_page: { 0: 1, 640: 2, 1024: 3 } })

			expect(instance.per_page).toBe(3)

			observer.to(700)
			expect(instance.per_page).toBe(2)

			observer.to(500)
			expect(instance.per_page).toBe(1)

			observer.to(1024)
			expect(instance.per_page).toBe(3)

			observer.restore()
		})

		it('resizes the slides through the custom property alone', () => {
			const observer = observing()
			const { el, track } = setup(9, { per_page: { 0: 1, 640: 2, 1024: 3 } })
			const before = [...track.children]

			observer.to(500)

			expect(el.style.getPropertyValue('--slider-per-page')).toBe('1')
			// The slides must survive untouched — no rebuild, so images and iframes keep their state
			expect([...track.children]).toEqual(before)

			observer.restore()
		})

		it('pulls the index back when fewer slides fit', () => {
			const observer = observing()
			const { instance } = setup(9, { per_page: { 0: 1, 1024: 3 } })

			instance.go_to(6)
			expect(instance.index).toBe(6)

			// At 3 per page the last full page starts at 6; at 1 per page it is 8, so this holds
			observer.to(500)
			expect(instance.index).toBe(6)

			instance.go_to(8)
			observer.to(1024)
			expect(instance.index).toBe(6)

			observer.restore()
		})

		it('rebuilds the clones when per_page changes while looping', () => {
			const observer = observing()
			const { track } = setup(9, { loop: true, per_page: { 0: 1, 1024: 3 } })

			expect(track.querySelectorAll('[data-slider-clone]')).toHaveLength(6)
			expect(track.children).toHaveLength(9 + 6)

			observer.to(500)

			expect(track.querySelectorAll('[data-slider-clone]')).toHaveLength(2)
			expect(track.children).toHaveLength(9 + 2)

			observer.restore()
		})

		it('leaves the clones alone when per_page is unchanged', () => {
			const observer = observing()
			const { track } = setup(9, { loop: true, per_page: 2 })
			const before = [...track.children]

			observer.to(500)

			expect([...track.children]).toEqual(before)

			observer.restore()
		})
	})

	describe('loop', () => {
		it('clones a page of slides at each end', () => {
			const { track } = setup(5, { loop: true, per_page: 2 })

			expect(track.children).toHaveLength(5 + 2 * 2)
			expect(track.querySelectorAll('[data-slider-clone]')).toHaveLength(4)
		})

		it('keeps clones out of the accessibility tree and tab order', () => {
			const { track } = setup(5, { loop: true })
			const clone = track.querySelector('[data-slider-clone]')!

			expect(clone.getAttribute('aria-hidden')).toBe('true')
			expect(clone.hasAttribute('inert')).toBe(true)
			expect(clone.hasAttribute('aria-label')).toBe(false)
		})

		it('strips ids from clones and their descendants', () => {
			const el = document.createElement('div')
			for (let i = 0; i < 3; i++) {
				const slide = document.createElement('div')
				slide.id = `slide-${i}`
				slide.innerHTML = '<span id="inner">x</span>'
				el.append(slide)
			}
			document.body.append(el)

			slider(el, { loop: true })

			for (const clone of el.querySelectorAll('[data-slider-clone]')) {
				expect(clone.hasAttribute('id')).toBe(false)
				expect(clone.querySelector('[id]')).toBeNull()
			}
			expect(el.querySelectorAll('#slide-0')).toHaveLength(1)
		})

		it('advances without wrapping in the middle of the list', () => {
			const { instance, track } = setup(5, { loop: true, start_index: 1 })

			instance.next()

			expect(instance.index).toBe(2)
			// Slot 3 of the padded track: two leading clones plus the slide itself
			expect(track.style.transform).toBe(`translate3d(${-3 * WIDTH}px, 0, 0)`)
		})

		it('goes back without wrapping in the middle of the list', () => {
			const { instance } = setup(5, { loop: true, start_index: 3 })

			instance.prev()

			expect(instance.index).toBe(2)
		})

		it('wraps forward past the end', () => {
			const { instance } = setup(5, { loop: true, start_index: 4 })

			instance.next()

			expect(instance.index).toBe(0)
		})

		it('wraps backward past the start', () => {
			const { instance } = setup(5, { loop: true })

			instance.prev()

			expect(instance.index).toBe(4)
		})

		it('wraps a jump in either direction', () => {
			const { instance } = setup(5, { loop: true })

			instance.go_to(7)
			expect(instance.index).toBe(2)

			instance.go_to(-1)
			expect(instance.index).toBe(4)
		})

		it('offsets the track past the leading clones', () => {
			const { track } = setup(5, { loop: true })

			expect(track.style.transform).toBe(`translate3d(${-WIDTH}px, 0, 0)`)
		})
	})

	describe('dragging', () => {
		it('advances when dragged past the threshold', () => {
			const { el, instance } = setup(5)

			drag(el, -100)

			expect(instance.index).toBe(1)
		})

		it('goes back when dragged the other way', () => {
			const { el, instance } = setup(5, { start_index: 2 })

			drag(el, 100)

			expect(instance.index).toBe(1)
		})

		it('snaps back when the drag is too short', () => {
			const { el, instance } = setup(5)

			drag(el, -15)

			expect(instance.index).toBe(0)
		})

		it('follows the pointer while dragging', () => {
			const { el, track } = setup(5)

			pointer(el, 'pointerdown', 0)
			pointer(el, 'pointermove', -50)

			expect(track.style.transform).toBe('translate3d(-50px, 0, 0)')
			expect(track.style.transition).toBe('transform 0ms ease-out')
		})

		it('advances multiple slides for a long drag', () => {
			const { el, instance } = setup(5)

			drag(el, -1500)

			expect(instance.index).toBe(3)
		})

		it('advances one slide when multiple_drag is off', () => {
			const { el, instance } = setup(5, { multiple_drag: false })

			drag(el, -1500)

			expect(instance.index).toBe(1)
		})

		it('locks to the vertical axis and lets the page scroll', () => {
			const { el, instance } = setup(5)

			pointer(el, 'pointerdown', 0, 0)
			pointer(el, 'pointermove', -30, -100)
			pointer(el, 'pointerup', -30, -100)

			expect(instance.index).toBe(0)
		})

		it('snaps back when the browser cancels the drag', () => {
			const { el, instance } = setup(5)

			pointer(el, 'pointerdown', 0)
			pointer(el, 'pointermove', -100)
			pointer(el, 'pointercancel', -100)

			expect(instance.index).toBe(0)
		})

		it('ignores drags starting on interactive descendants', () => {
			const { el, instance, track } = setup(5)
			const input = document.createElement('input')
			track.children[0].append(input)

			input.dispatchEvent(
				new PointerEvent('pointerdown', { pointerId: 1, clientX: 0, button: 0, bubbles: true })
			)
			pointer(el, 'pointermove', -100)
			pointer(el, 'pointerup', -100)

			expect(instance.index).toBe(0)
		})

		it('respects an explicit opt-out', () => {
			const { el, instance, track } = setup(5)
			const opt_out = document.createElement('span')
			opt_out.dataset.sliderIgnore = ''
			track.children[0].append(opt_out)

			opt_out.dispatchEvent(
				new PointerEvent('pointerdown', { pointerId: 1, clientX: 0, button: 0, bubbles: true })
			)
			pointer(el, 'pointermove', -100)
			pointer(el, 'pointerup', -100)

			expect(instance.index).toBe(0)
		})

		it('ignores secondary pointer buttons', () => {
			const { el, instance } = setup(5)

			el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 0, button: 2, bubbles: true }))
			pointer(el, 'pointermove', -100)
			pointer(el, 'pointerup', -100)

			expect(instance.index).toBe(0)
		})

		it('swallows the click that follows a drag', () => {
			const { el, track } = setup(5)
			const link = document.createElement('a')
			link.href = '#somewhere'
			track.children[1].append(link)

			const listener = vi.fn()
			el.addEventListener('click', listener)
			drag(el, -100)
			link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

			expect(listener).not.toHaveBeenCalled()
		})

		it('lets a click through when the pointer barely moved', () => {
			const { el, track } = setup(5)
			const listener = vi.fn()
			el.addEventListener('click', listener)

			drag(el, -2)
			track.children[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

			expect(listener).toHaveBeenCalledOnce()
		})

		it('does not drag when draggable is off', () => {
			const { el, instance } = setup(5, { draggable: false })

			drag(el, -100)

			expect(instance.index).toBe(0)
			expect(el.style.cursor).toBe('')
		})
	})

	describe('wheel', () => {
		beforeEach(() => vi.useFakeTimers())

		it('advances on a horizontal gesture', () => {
			const { el, instance } = setup(5)

			wheel(el, 400)
			settle_wheel()

			expect(instance.index).toBe(1)
		})

		it('goes back on the opposite gesture', () => {
			const { el, instance } = setup(5, { start_index: 2 })

			wheel(el, -400)
			settle_wheel()

			expect(instance.index).toBe(1)
		})

		it('follows the gesture before it settles', () => {
			const { el, track } = setup(5)

			wheel(el, 50)

			expect(track.style.transform).toBe('translate3d(-50px, 0, 0)')
			expect(track.style.transition).toBe('transform 0ms ease-out')
		})

		it('accumulates events within one gesture', () => {
			const { el, track, instance } = setup(5)

			wheel(el, 200)
			wheel(el, 200)
			expect(track.style.transform).toBe('translate3d(-400px, 0, 0)')

			settle_wheel()
			expect(instance.index).toBe(1)
		})

		it('settles on the nearest slide rather than the next one', () => {
			const { el, instance } = setup(5)

			// A third of a slide: a drag this size would advance, a scroll should fall back.
			wheel(el, 200)
			settle_wheel()

			expect(instance.index).toBe(0)
		})

		it('returns the track to the slide it settles on', () => {
			const { el, track } = setup(5)

			wheel(el, 200)
			settle_wheel()

			expect(track.style.transform).toBe('translate3d(0px, 0, 0)')
		})

		it('leaves vertical gestures to the page', () => {
			const { el, instance, track } = setup(5)

			const event = wheel(el, 0, 300)
			settle_wheel()

			expect(event.defaultPrevented).toBe(false)
			expect(instance.index).toBe(0)
			expect(track.style.transform).toBe('translate3d(0px, 0, 0)')
		})

		it('claims horizontal gestures so they cannot navigate the browser back', () => {
			const { el } = setup(5)

			expect(wheel(el, 120).defaultPrevented).toBe(true)
		})

		it('does not run beyond the last slide', () => {
			const { el, instance, track } = setup(5)

			wheel(el, 100_000)
			expect(track.style.transform).toBe('translate3d(-2400px, 0, 0)')

			settle_wheel()
			expect(instance.index).toBe(4)
		})

		it('does not run beyond the first slide', () => {
			const { el, instance, track } = setup(5)

			wheel(el, -100_000)
			expect(track.style.transform).toBe('translate3d(0px, 0, 0)')

			settle_wheel()
			expect(instance.index).toBe(0)
		})

		it('ignores a wheel event while a drag is in progress', () => {
			const { el, track } = setup(5)

			pointer(el, 'pointerdown', 0)
			pointer(el, 'pointermove', -50)
			wheel(el, 400)

			expect(track.style.transform).toBe('translate3d(-50px, 0, 0)')
		})

		it('does nothing when every slide is already visible', () => {
			const { el } = setup(2, { per_page: 2 })

			expect(wheel(el, 400).defaultPrevented).toBe(false)
		})

		it('does not respond when wheel is off', () => {
			const { el, instance } = setup(5, { wheel: false })

			const event = wheel(el, 400)
			settle_wheel()

			expect(event.defaultPrevented).toBe(false)
			expect(instance.index).toBe(0)
		})

		it('stops responding once destroyed', () => {
			const { el, instance } = setup(5)

			instance.destroy()

			expect(wheel(el, 400).defaultPrevented).toBe(false)
		})
	})

	describe('keyboard', () => {
		it('navigates with the arrow keys', () => {
			const { el, instance } = setup(5)

			key(el, 'ArrowRight')
			expect(instance.index).toBe(1)

			key(el, 'ArrowLeft')
			expect(instance.index).toBe(0)
		})

		it('jumps with Home and End', () => {
			const { el, instance } = setup(5)

			key(el, 'End')
			expect(instance.index).toBe(4)

			key(el, 'Home')
			expect(instance.index).toBe(0)
		})

		it('swaps the arrow keys when rtl', () => {
			const { el, instance } = setup(5, { rtl: true })

			key(el, 'ArrowLeft')

			expect(instance.index).toBe(1)
		})

		it('ignores unrelated keys', () => {
			const { el, instance } = setup(5)

			key(el, 'a')

			expect(instance.index).toBe(0)
		})

		it('does nothing when keyboard navigation is off', () => {
			const { el, instance } = setup(5, { keyboard: false })

			key(el, 'ArrowRight')

			expect(instance.index).toBe(0)
		})
	})

	describe('mutation', () => {
		it('appends to the end', () => {
			const { instance, track } = setup(3)
			const item = document.createElement('div')
			item.textContent = 'added'

			instance.append(item)

			expect(instance.length).toBe(4)
			expect(track.children).toHaveLength(4)
			expect(track.children[3].textContent).toBe('added')
		})

		it('prepends to the start', () => {
			const { instance, track } = setup(3)
			const item = document.createElement('div')
			item.textContent = 'added'

			instance.prepend(item)

			expect(track.children[0].textContent).toBe('added')
		})

		it('relabels slides after a change', () => {
			const { instance, track } = setup(3)

			instance.append(document.createElement('div'))

			expect(track.children[0].getAttribute('aria-label')).toBe('1 of 4')
			expect(track.children[3].getAttribute('aria-label')).toBe('4 of 4')
		})

		it('keeps the current slide in view when inserting before it', () => {
			const { instance } = setup(5, { start_index: 2 })

			instance.insert(document.createElement('div'), 1)

			expect(instance.index).toBe(3)
		})

		it('leaves the index alone when inserting after the current slide', () => {
			const { instance } = setup(5, { start_index: 2 })

			instance.insert(document.createElement('div'), 4)

			expect(instance.index).toBe(2)
		})

		it('leaves the index alone when prepending to a slider at the start', () => {
			const { instance } = setup(5)

			instance.prepend(document.createElement('div'))

			expect(instance.index).toBe(0)
		})

		it('rejects an out of range insert', () => {
			const { instance } = setup(3)

			expect(() => instance.insert(document.createElement('div'), -1)).toThrow(/cannot insert/)
			expect(() => instance.insert(document.createElement('div'), 4)).toThrow(/cannot insert/)
		})

		it('rejects a slide it already holds', () => {
			const { instance, track } = setup(3)

			expect(() => instance.insert(track.children[0] as HTMLElement, 0)).toThrow(/already in the slider/)
		})

		it('removes a slide', () => {
			const { instance, track } = setup(3)
			const going = track.children[1]

			instance.remove(1)

			expect(instance.length).toBe(2)
			expect(track.children).toHaveLength(2)
			expect(going.isConnected).toBe(false)
		})

		it('shifts back when a slide before the current one goes', () => {
			const { instance } = setup(5, { start_index: 3 })

			instance.remove(0)

			expect(instance.index).toBe(2)
		})

		it('never drives the index negative', () => {
			const { instance } = setup(3)

			instance.remove(0)

			expect(instance.index).toBe(0)
		})

		it('clamps the index when the tail is removed', () => {
			const { instance } = setup(3, { start_index: 2 })

			instance.remove(2)
			instance.remove(1)

			expect(instance.index).toBe(0)
			expect(instance.length).toBe(1)
		})

		it('rejects an out of range remove', () => {
			const { instance } = setup(3)

			expect(() => instance.remove(3)).toThrow(/no slide at index/)
			expect(() => instance.remove(-1)).toThrow(/no slide at index/)
		})

		it('strips styling from a removed slide', () => {
			const { instance, track } = setup(3)
			const going = track.children[1] as HTMLElement

			instance.remove(1)

			expect(going.getAttribute('style')).toBeFalsy()
			expect(going.hasAttribute('role')).toBe(false)
		})

		it('rebuilds clones when looping', () => {
			const { instance, track } = setup(3, { loop: true })

			instance.append(document.createElement('div'))

			expect(track.children).toHaveLength(4 + 2)
			expect(track.querySelectorAll('[data-slider-clone]')).toHaveLength(2)
		})
	})

	describe('autoplay', () => {
		it('advances on an interval', () => {
			vi.useFakeTimers()
			const { instance } = setup(5, { autoplay: 1000 })

			vi.advanceTimersByTime(1000)
			expect(instance.index).toBe(1)

			vi.advanceTimersByTime(1000)
			expect(instance.index).toBe(2)
		})

		it('does not autoplay by default', () => {
			vi.useFakeTimers()
			const { instance } = setup(5)

			vi.advanceTimersByTime(10_000)

			expect(instance.index).toBe(0)
		})

		it('stops on pause and restarts on play', () => {
			vi.useFakeTimers()
			const { instance } = setup(5, { autoplay: 1000 })

			instance.pause()
			vi.advanceTimersByTime(5000)
			expect(instance.index).toBe(0)

			instance.play()
			vi.advanceTimersByTime(1000)
			expect(instance.index).toBe(1)
		})

		it('pauses while dragging', () => {
			vi.useFakeTimers()
			const { el, instance } = setup(5, { autoplay: 1000 })

			pointer(el, 'pointerdown', 0)
			vi.advanceTimersByTime(5000)

			expect(instance.index).toBe(0)
		})

		it('stops once destroyed', () => {
			vi.useFakeTimers()
			const { instance } = setup(5, { autoplay: 1000 })

			instance.destroy()
			vi.advanceTimersByTime(5000)

			expect(instance.index).toBe(0)
		})

		it('pauses while the tab is hidden and resumes when it returns', () => {
			vi.useFakeTimers()
			const { instance } = setup(5, { autoplay: 1000 })

			set_hidden(true)
			vi.advanceTimersByTime(5000)
			expect(instance.index).toBe(0)

			set_hidden(false)
			vi.advanceTimersByTime(1000)
			expect(instance.index).toBe(1)
		})
	})

	describe('reduced motion', () => {
		it('animates normally by default', () => {
			const { instance, track } = setup(5)

			instance.next()

			expect(track.style.transition).toBe('transform 200ms ease-out')
		})

		it('drops the transition duration to zero', () => {
			set_reduced(true)
			const { instance, track } = setup(5)

			instance.next()

			expect(track.style.transition).toBe('transform 0ms ease-out')
		})

		it('never starts autoplay', () => {
			set_reduced(true)
			vi.useFakeTimers()
			const { instance } = setup(5, { autoplay: 1000 })

			vi.advanceTimersByTime(5000)

			expect(instance.index).toBe(0)
		})

		it('reacts to the preference changing after setup', () => {
			const motion = set_reduced(false)
			const { instance, track } = setup(5)

			instance.next()
			expect(track.style.transition).toBe('transform 200ms ease-out')

			motion.change(true)
			expect(track.style.transition).toBe('transform 0ms ease-out')

			motion.change(false)
			expect(track.style.transition).toBe('transform 200ms ease-out')
		})

		it('halts autoplay when the preference turns on', () => {
			vi.useFakeTimers()
			const motion = set_reduced(false)
			const { instance } = setup(5, { autoplay: 1000 })

			vi.advanceTimersByTime(1000)
			expect(instance.index).toBe(1)

			motion.change(true)
			vi.advanceTimersByTime(5000)
			expect(instance.index).toBe(1)
		})
	})

	describe('update', () => {
		it('re-measures without moving', () => {
			const { instance, track } = setup(5, { start_index: 2 })

			instance.update()

			expect(instance.index).toBe(2)
			expect(track.style.transform).toBe(`translate3d(${-2 * WIDTH}px, 0, 0)`)
		})
	})

	describe('destroy', () => {
		it('restores the original children', () => {
			const { el, instance } = setup(3)

			instance.destroy()

			expect(el.children).toHaveLength(3)
			expect(el.children[0].textContent).toBe('slide 0')
			expect(el.querySelector('[data-slider-clone]')).toBeNull()
		})

		it('drops clones when looping', () => {
			const { el, instance } = setup(3, { loop: true })

			instance.destroy()

			expect(el.children).toHaveLength(3)
			expect(el.querySelector('[data-slider-clone]')).toBeNull()
		})

		it('removes the styling and markup it added', () => {
			const { el, instance } = setup(3)

			instance.destroy()

			expect(el.getAttribute('style')).toBeFalsy()
			expect(el.hasAttribute('role')).toBe(false)
			expect(el.hasAttribute('aria-roledescription')).toBe(false)
			expect(el.hasAttribute('aria-label')).toBe(false)
			expect(el.hasAttribute('tabindex')).toBe(false)
			for (const slide of el.children) {
				expect(slide.getAttribute('style')).toBeFalsy()
				expect(slide.hasAttribute('role')).toBe(false)
			}
		})

		it('detaches its listeners', () => {
			const { el, instance } = setup(5)

			instance.destroy()
			drag(el, -100)
			key(el, 'ArrowRight')

			expect(instance.index).toBe(0)
		})

		it('dispatches sliderdestroy', () => {
			const { el, instance } = setup(3)
			const listener = vi.fn()
			el.addEventListener('sliderdestroy', listener)

			instance.destroy()

			expect(listener).toHaveBeenCalledOnce()
		})

		it('is idempotent', () => {
			const { el, instance } = setup(3)
			const listener = vi.fn()
			el.addEventListener('sliderdestroy', listener)

			instance.destroy()
			instance.destroy()

			expect(listener).toHaveBeenCalledOnce()
			expect(el.children).toHaveLength(3)
		})
	})
})

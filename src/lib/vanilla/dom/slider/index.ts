import { clamp } from '../../number/clamp/index.js'

/**
 * @module slider
 * @group Vanilla
 * @version 1.0.0
 * @remarks
 * A small, dependency-free carousel. Descended from Siema but rebuilt on modern
 * primitives: a flexbox track driven by a single `--slider-per-page` custom property,
 * Pointer Events with pointer capture for dragging, and a `ResizeObserver` for
 * measurement. Slides are the element's own children — they are never wrapped, so your
 * own CSS keeps working.
 *
 * Slides normally share the track evenly, `per_page` at a time. Pass `per_page: 'auto'` to
 * hand sizing back to your CSS instead: every slide keeps the width you give it, wide and
 * narrow ones sit side by side, and the slider measures them rather than assuming.
 *
 * State is reported with `CustomEvent`s on the element rather than option callbacks:
 * `sliderinit`, `sliderchange`, `sliderresize` and `sliderdestroy`. `sliderinit` fires in a
 * microtask, so you can attach listeners immediately after constructing the slider.
 *
 * Accessible by default: the element becomes a labelled carousel region, slides are
 * announced positionally, looped clones are `inert`, arrow keys navigate, and
 * `prefers-reduced-motion` disables both animation and autoplay.
 *
 * The element is styled with `overflow: hidden` and `touch-action: pan-y`, so vertical
 * page scrolling passes through a horizontal drag untouched.
 *
 * Horizontal wheel and trackpad gestures move the track too, settling on the nearest slide
 * once they stop. Only gestures that are more horizontal than vertical are claimed, so a
 * mouse wheel still scrolls the page; those that are claimed are cancelled, which keeps a
 * two-finger swipe from being read as browser back-navigation.
 *
 * @example
 * ```ts
 * import { slider } from 'kitto'
 *
 * const el = document.querySelector('.slider')
 *
 * const carousel = slider(el, {
 *   per_page: { 0: 1, 640: 2, 1024: 3 },
 *   loop: true,
 *   autoplay: 4000
 * })
 *
 * el.addEventListener('sliderchange', e => console.log(e.detail.index))
 *
 * document.querySelector('.next').onclick = () => carousel.next()
 * ```
 */

/** Selector for descendants that should never start a drag. */
const IGNORE = 'input, textarea, select, button, a[href], [contenteditable], [data-slider-ignore]'

/** Per-slide sizing. Percentages resolve against the track, so changing the custom property resizes every slide. */
const FLEX = '0 0 calc(100% / var(--slider-per-page, 1))'

/** Per-slide sizing when the slides bring their own widths. */
const FLEX_AUTO = '0 0 auto'

/** Sub-pixel slack, so a slide that only just fits is not measured out of the running. */
const SLACK = 0.5

/** Movement in px before the drag axis is locked. */
const AXIS_SLOP = 5

/** Movement in px past which the click following a drag is swallowed. */
const CLICK_SLOP = 5

/** Idle time in ms after the last wheel event before the gesture counts as finished. */
const WHEEL_END = 120

/**
 * Coerce a slide count, guarding the way a bad value tends to arrive: passing `next` or
 * `prev` straight to an event listener, which supplies the event.
 */
function to_count(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 1
}

export interface SliderOptions {
	/**
	 * Slides visible at once. Pass an object to vary it by viewport width, e.g. `{ 0: 1, 640: 2 }`,
	 * or `'auto'` to leave each slide at whatever width your CSS gives it. Default `1`.
	 */
	per_page?: number | 'auto' | Record<number, number>
	/** Slide to show first. Default `0`. */
	start_index?: number
	/** Transition duration in ms. Default `200`. */
	duration?: number
	/** Transition easing. Default `'ease-out'`. */
	easing?: string
	/** Allow pointer dragging. Default `true`. */
	draggable?: boolean
	/** Move with horizontal wheel and trackpad gestures. Default `true`. */
	wheel?: boolean
	/** Let one long drag advance more than one slide. Default `true`. */
	multiple_drag?: boolean
	/** Drag distance in px required to change slide. Default `20`. */
	threshold?: number
	/**
	 * Let the last slide reach the leading edge instead of stopping on a full page, leaving
	 * empty space after it. Gives every slide a resting position, so one dot per slide is
	 * reachable when `per_page` shows more than one. Ignored while looping. Default `false`.
	 */
	pad?: boolean
	/** Wrap around at the ends using cloned slides. Default `false`. */
	loop?: boolean
	/** Lay the slides out right-to-left. Default `false`. */
	rtl?: boolean
	/** Navigate with arrow, Home and End keys. Default `true`. */
	keyboard?: boolean
	/** Advance automatically every n ms. `0` disables it. Default `0`. */
	autoplay?: number
	/** Accessible name for the carousel region. Default `'Carousel'`. */
	label?: string
}

export interface Slider {
	/** Index of the leading visible slide. */
	readonly index: number
	/** Number of slides. */
	readonly length: number
	/** Slides currently visible at once. Always `1` when `per_page` is `'auto'`. */
	readonly per_page: number
	/** Highest index the slider can reach, given `per_page`, `pad` and `loop`. */
	readonly max: number
	/** Advance by `count` slides. */
	next(count?: number): void
	/** Go back by `count` slides. */
	prev(count?: number): void
	/** Jump to a slide by index. */
	go_to(index: number): void
	/** Insert a slide at `index`. */
	insert(item: HTMLElement, index: number): void
	/** Remove the slide at `index`. */
	remove(index: number): void
	/** Insert a slide at the start. */
	prepend(item: HTMLElement): void
	/** Insert a slide at the end. */
	append(item: HTMLElement): void
	/** Start autoplay, if an `autoplay` interval was set. */
	play(): void
	/** Stop autoplay. */
	pause(): void
	/** Re-measure and re-render, e.g. after changing slide contents. */
	update(): void
	/** Detach everything and restore the original markup. */
	destroy(): void
}

/**
 * Create a slider from an element's children.
 * @param target - The element to turn into a slider, or a selector for it
 * @param options - Optional settings
 * @returns A handle for controlling the slider
 * @throws If `target` matches no element
 */
export function slider(target: HTMLElement | string, options: SliderOptions = {}): Slider {
	const found = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target

	if (!found) throw new Error(`slider: no element matches '${String(target)}'`)

	// Re-declared non-nullable, since narrowing does not reach the hoisted helpers below.
	const node: HTMLElement = found

	const {
		per_page = 1,
		start_index = 0,
		duration = 200,
		easing = 'ease-out',
		draggable = true,
		wheel = true,
		multiple_drag = true,
		threshold = 20,
		pad = false,
		loop = false,
		rtl = false,
		keyboard = true,
		autoplay = 0,
		label = 'Carousel'
	} = options

	/** Breakpoints sorted ascending, so the widest match wins regardless of key order. */
	const breakpoints =
		typeof per_page === 'object'
			? Object.entries(per_page)
					.map(([width, value]): [number, number] => [Number(width), value])
					.sort((a, b) => a[0] - b[0])
			: []

	/** Auto width hands sizing to your CSS, so the slides have to be measured rather than computed. */
	const auto = per_page === 'auto'

	const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
	const track = document.createElement('div')

	const slides = [...node.children] as HTMLElement[]
	let pages = resolve_pages()
	let width = 0
	// Left unclamped: `build` measures the slides before normalising it into range.
	let index = loop ? wrap(start_index) : start_index
	let reduced = motion?.matches ?? false
	let destroyed = false

	// Auto-width geometry, all measured: where each slide's leading edge sits relative to the
	// first, how long one full run of slides is, and how much room the leading clones take.
	let positions: number[] = []
	let extent = 0
	let lead = 0

	/** Slides duplicated at each end while looping. */
	let clones = auto ? 1 : pages

	// Drag state. `delta` stays set until the drag has been fully settled, so a clone jump
	// mid-drag can account for the distance already travelled.
	let pointer_id: number | null = null
	let start_x = 0
	let start_y = 0
	let delta = 0
	let axis: 'x' | 'y' | null = null

	// A wheel gesture has no release to settle on, so it is settled once the events stop.
	let wheel_timer: ReturnType<typeof setTimeout> | undefined

	let timer: ReturnType<typeof setTimeout> | undefined
	let wants_play = autoplay > 0

	/* Geometry */

	function resolve_pages(): number {
		if (auto) return 1
		if (typeof per_page === 'number') return Math.max(1, per_page)

		let value = 1
		for (const [breakpoint, count] of breakpoints) if (window.innerWidth >= breakpoint) value = count
		return Math.max(1, value)
	}

	/** Whether every slide is on screen at once, leaving nowhere to go. */
	function fits(): boolean {
		return auto ? extent <= width + SLACK : slides.length <= pages
	}

	/**
	 * Highest index the slider can reach. Normally the last page stays full, so the final
	 * slides share a resting position; `pad` instead lets every slide lead in turn, running
	 * on into empty space, which is what makes one dot per slide reachable.
	 */
	function max_index(): number {
		if (loop) return Math.max(0, slides.length - 1)
		if (fits()) return 0
		if (pad) return slides.length - 1

		if (auto) {
			// The last slide that still has a full track's worth of slides behind it.
			let value = 0
			while (value < slides.length - 1 && extent - positions[value + 1] >= width - SLACK) value++
			return value
		}

		return Math.max(0, slides.length - pages)
	}

	/** Bring an index into range, wrapping negatives when looping. */
	function wrap(value: number): number {
		const total = slides.length
		return total ? ((value % total) + total) % total : 0
	}

	/**
	 * Distance from the track's leading edge to a slide. Indices outside the slides address the
	 * clones on either side, which is where a loop jump lands.
	 */
	function ladder(value: number): number {
		if (!auto) return (loop ? value + pages : value) * (width / pages)
		if (!slides.length) return 0
		if (value < 0) return ladder(value + slides.length) - extent
		if (value >= slides.length) return ladder(value - slides.length) + extent

		return lead + (positions[value] ?? 0)
	}

	/** How far the track travels to pass one slide. */
	function span(value: number): number {
		if (!auto) return width / pages

		const at = wrap(value)
		return (at === slides.length - 1 ? extent : (positions[at + 1] ?? 0)) - (positions[at] ?? 0)
	}

	/** Track offset in px for a slide index, accounting for the leading clones and direction. */
	function offset_for(value: number): number {
		return (rtl ? 1 : -1) * ladder(value)
	}

	function translate(x: number): void {
		track.style.transform = `translate3d(${x}px, 0, 0)`
	}

	function set_transition(ms: number): void {
		track.style.transition = `transform ${ms}ms ${easing}`
	}

	/** Animation duration, honouring reduced motion. */
	function animated(): number {
		return reduced ? 0 : duration
	}

	/**
	 * Move the track to the current slide.
	 * `after_jump` defers to the next frame so the browser commits a transition-less
	 * repositioning first, then animates onward — otherwise the jump itself animates.
	 */
	function render(after_jump = false): void {
		if (!after_jump) {
			set_transition(animated())
			translate(offset_for(index))
			return
		}

		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (destroyed) return
				set_transition(animated())
				translate(offset_for(index))
			})
		)
	}

	/** Reposition without animating, e.g. after a resize or a slide being added. */
	function render_now(): void {
		set_transition(0)
		translate(offset_for(index))
		requestAnimationFrame(() => {
			if (!destroyed) set_transition(animated())
		})
	}

	/* Markup */

	function decorate(slide: HTMLElement, position: number): void {
		slide.style.flex = auto ? FLEX_AUTO : FLEX
		slide.setAttribute('role', 'group')
		slide.setAttribute('aria-roledescription', 'slide')
		slide.setAttribute('aria-label', `${position + 1} of ${slides.length}`)
	}

	function strip(slide: HTMLElement): void {
		slide.style.removeProperty('flex')
		slide.removeAttribute('role')
		slide.removeAttribute('aria-roledescription')
		slide.removeAttribute('aria-label')
	}

	/** Duplicate a slide for looping, keeping it out of the accessibility tree and the tab order. */
	function clone(slide: HTMLElement): HTMLElement {
		const copy = slide.cloneNode(true) as HTMLElement

		copy.removeAttribute('id')
		copy.removeAttribute('aria-label')
		copy.setAttribute('aria-hidden', 'true')
		copy.setAttribute('inert', '')
		copy.setAttribute('data-slider-clone', '')
		for (const el of copy.querySelectorAll('[id]')) el.removeAttribute('id')

		return copy
	}

	/** Put the slides in the track, wrapped in clones when looping. */
	function fill(): void {
		const content = loop
			? [...slides.slice(-clones).map(clone), ...slides, ...slides.slice(0, clones).map(clone)]
			: slides

		track.replaceChildren(...content)
	}

	/** Slides to duplicate at each end while looping — enough of them to cover the track. */
	function cover(): number {
		return auto ? Math.max(reach(1), reach(-1)) : pages
	}

	/** Slides needed from one end of the run to fill the track. */
	function reach(direction: 1 | -1): number {
		let count = 0

		for (let total = 0; total < width && count < slides.length; count++) {
			total += span(direction > 0 ? count : slides.length - 1 - count)
		}

		return Math.max(1, count)
	}

	/**
	 * Measure the slides. Equal-width ones are a ladder the track's own width already describes,
	 * so only auto-width ones are read back from the DOM. Positions are taken from the track's
	 * leading edge, which keeps any margin between the slides in the reckoning.
	 */
	function layout(): void {
		if (!auto) return

		const box = track.getBoundingClientRect()
		const origin = rtl ? box.right : box.left
		const first = slides[0]
		const last = slides[slides.length - 1]

		/** The track and its slides carry the same transform, so it cancels out here. */
		const at = (el: Element): number => {
			const rect = el.getBoundingClientRect()
			return rtl ? origin - rect.right : rect.left - origin
		}

		if (!first || !last) {
			positions = []
			extent = 0
			lead = 0
			return
		}

		lead = at(first)
		positions = slides.map(slide => at(slide) - lead)

		// The first trailing clone marks where the next run begins, so looping measures the gap too.
		const after = loop ? track.children[clones + slides.length] : undefined
		extent = after ? at(after) - lead : positions[slides.length - 1] + last.getBoundingClientRect().width
	}

	/** Lay out the track. Clones are recreated from scratch, so this is safe to re-run. */
	function build(): void {
		slides.forEach(decorate)
		// Equal-width clones can be counted up front; auto-width ones need the slides measured first.
		if (!auto) clones = pages

		fill()
		layout()

		const needed = loop ? cover() : clones
		if (needed !== clones) {
			clones = needed
			fill()
			layout()
		}

		normalise()
		render_now()
	}

	function normalise(): void {
		index = clamp(index, 0, max_index())
	}

	/* Navigation */

	function emit(type: string, detail: Record<string, unknown>): void {
		node.dispatchEvent(new CustomEvent(type, { detail }))
	}

	function changed(previous: number): void {
		emit('sliderchange', { index, previous, per_page: pages })
	}

	function next(steps?: number): void {
		if (fits()) return

		const count = to_count(steps)
		const previous = index
		let jumped = false

		if (loop && index + count > slides.length - pages) {
			// Land on the trailing clones without animating, then animate on to the real slide.
			const mirror = index - slides.length
			set_transition(0)
			translate(offset_for(mirror) + delta)
			index = mirror + count
			jumped = true
		} else if (loop) {
			index += count
		} else {
			index = clamp(index + count, 0, max_index())
		}

		if (index === previous) return
		render(jumped)
		changed(previous)
	}

	function prev(steps?: number): void {
		if (fits()) return

		const count = to_count(steps)
		const previous = index
		let jumped = false

		if (loop && index - count < 0) {
			const mirror = index + slides.length
			set_transition(0)
			translate(offset_for(mirror) + delta)
			index = mirror - count
			jumped = true
		} else if (loop) {
			index -= count
		} else {
			index = clamp(index - count, 0, max_index())
		}

		if (index === previous) return
		render(jumped)
		changed(previous)
	}

	function go_to(value: number): void {
		if (fits()) return

		const previous = index
		index = loop ? wrap(value) : clamp(value, 0, max_index())

		if (index === previous) return
		render()
		changed(previous)
	}

	/* Dragging */

	function on_down(event: PointerEvent): void {
		if (!draggable || event.button !== 0 || pointer_id !== null) return
		if (event.target instanceof Element && event.target.closest(IGNORE)) return

		pointer_id = event.pointerId
		start_x = event.clientX
		start_y = event.clientY
		delta = 0
		axis = null

		node.setPointerCapture?.(event.pointerId)
		stop()
	}

	function on_move(event: PointerEvent): void {
		if (pointer_id !== event.pointerId) return

		const dx = event.clientX - start_x
		const dy = event.clientY - start_y

		if (axis === null) {
			if (Math.abs(dx) < AXIS_SLOP && Math.abs(dy) < AXIS_SLOP) return
			axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
			if (axis === 'x') {
				node.style.cursor = 'grabbing'
				node.style.userSelect = 'none'
			}
		}

		if (axis !== 'x') return

		delta = dx
		set_transition(0)
		translate(offset_for(index) + delta)
	}

	function on_up(event: PointerEvent): void {
		if (pointer_id !== event.pointerId) return

		release(event.pointerId)

		if (axis === 'x') {
			if (Math.abs(delta) > CLICK_SLOP) swallow_click()
			settle()
		}

		delta = 0
		axis = null
		start()
	}

	function on_cancel(event: PointerEvent): void {
		if (pointer_id !== event.pointerId) return

		release(event.pointerId)
		delta = 0
		axis = null
		render()
		start()
	}

	function release(id: number): void {
		node.releasePointerCapture?.(id)
		pointer_id = null
		node.style.cursor = draggable ? 'grab' : ''
		node.style.removeProperty('user-select')
	}

	/**
	 * Decide where a finished gesture lands. A drag rounds away from its start, so a short
	 * flick still advances; a wheel gesture snaps to whichever slide it came to rest nearest,
	 * the way a scroll container with scroll snapping would.
	 */
	function settle(snap: 'away' | 'nearest' = 'away'): void {
		const movement = (rtl ? -1 : 1) * delta
		const distance = Math.abs(movement)
		const steps = crossed(distance, movement > 0 ? -1 : 1, snap)
		const count = multiple_drag ? steps : Math.min(steps, 1)
		const previous = index

		if (distance > threshold && count > 0) {
			if (movement > 0) prev(count)
			else next(count)
		}

		// `prev` and `next` return without rendering when the index cannot move any further,
		// which would strand the track wherever the gesture left it.
		if (index === previous) render()
	}

	/**
	 * How many slides a gesture of `distance` px covered, walking out from the current one so
	 * that slides of different widths each count for the room they actually take.
	 */
	function crossed(distance: number, direction: 1 | -1, snap: 'away' | 'nearest'): number {
		let steps = 0
		let travelled = 0

		while (steps < slides.length) {
			const size = span(direction > 0 ? index + steps : index - steps - 1)
			const left = distance - travelled

			if (!size) break
			if (left <= size) return steps + (left > (snap === 'nearest' ? size / 2 : 0) ? 1 : 0)

			travelled += size
			steps++
		}

		return steps
	}

	/** Stop the click that follows a drag, so dragging a link doesn't navigate. */
	function swallow_click(): void {
		const block = (event: MouseEvent) => {
			event.preventDefault()
			event.stopPropagation()
		}

		node.addEventListener('click', block, { capture: true, once: true })
		setTimeout(() => node.removeEventListener('click', block, true))
	}

	/* Wheel */

	/** Hold a wheel gesture inside the track, which unlike a drag has no natural limit. */
	function bound(value: number): number {
		if (loop) return value

		const limit = ladder(max_index())
		const offset = offset_for(index)

		return rtl ? clamp(value, -offset, limit - offset) : clamp(value, -limit - offset, -offset)
	}

	function on_wheel(event: WheelEvent): void {
		// Vertical intent belongs to the page, and a drag in progress already owns the track.
		if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || pointer_id !== null) return
		if (fits()) return

		// Also stops the browser reading the gesture as a back-navigation swipe.
		event.preventDefault()
		stop()

		delta = bound(delta - event.deltaX)
		set_transition(0)
		translate(offset_for(index) + delta)

		clearTimeout(wheel_timer)
		wheel_timer = setTimeout(() => {
			wheel_timer = undefined
			settle('nearest')
			delta = 0
			start()
		}, WHEEL_END)
	}

	/* Keyboard */

	function on_key(event: KeyboardEvent): void {
		const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
		const back = rtl ? 'ArrowRight' : 'ArrowLeft'

		if (event.key === forward) next()
		else if (event.key === back) prev()
		else if (event.key === 'Home') go_to(0)
		else if (event.key === 'End') go_to(max_index())
		else return

		event.preventDefault()
	}

	/* Autoplay */

	function start(): void {
		if (!autoplay || reduced || !wants_play || timer !== undefined || destroyed) return

		timer = setTimeout(() => {
			timer = undefined
			next()
			start()
		}, autoplay)
	}

	function stop(): void {
		clearTimeout(timer)
		timer = undefined
	}

	function play(): void {
		wants_play = true
		start()
	}

	function pause(): void {
		wants_play = false
		stop()
	}

	function on_visibility(): void {
		if (document.hidden) stop()
		else start()
	}

	function on_motion_change(): void {
		reduced = motion?.matches ?? false
		if (reduced) stop()
		else start()
		set_transition(animated())
	}

	/* Measurement */

	function measure(): void {
		const before = { pages, index, max: max_index() }

		pages = resolve_pages()
		width = track.clientWidth

		if (!auto && pages !== before.pages) node.style.setProperty('--slider-per-page', String(pages))

		layout()

		// Looping covers the track with clones at each end, so a new page count — or, with
		// auto width, a new track width — changes how many of them are needed.
		if (loop && cover() !== clones) {
			build()
		} else {
			normalise()
			render_now()
		}

		if (pages !== before.pages || index !== before.index || max_index() !== before.max) {
			emit('sliderresize', { index, per_page: pages, max: max_index() })
		}
	}

	const observer = new ResizeObserver(measure)

	/* Mutation */

	function insert(item: HTMLElement, position: number): void {
		if (position < 0 || position > slides.length) throw new Error(`slider: cannot insert at index ${position}`)
		if (slides.includes(item)) throw new Error('slider: that slide is already in the slider')

		if (position <= index && index > 0) index += 1
		slides.splice(position, 0, item)
		build()
	}

	function remove(position: number): void {
		if (position < 0 || position >= slides.length) throw new Error(`slider: no slide at index ${position}`)

		const [gone] = slides.splice(position, 1)
		strip(gone)
		gone.remove()

		// Shift back when a slide before the current one, or the last visible one, disappears.
		if (position < index || index + pages - 1 === position) index -= 1
		build()
	}

	function update(): void {
		measure()
	}

	function destroy(): void {
		if (destroyed) return
		destroyed = true

		stop()
		clearTimeout(wheel_timer)
		observer.disconnect()
		motion?.removeEventListener('change', on_motion_change)
		document.removeEventListener('visibilitychange', on_visibility)
		node.removeEventListener('pointerdown', on_down)
		node.removeEventListener('pointermove', on_move)
		node.removeEventListener('pointerup', on_up)
		node.removeEventListener('pointercancel', on_cancel)
		node.removeEventListener('wheel', on_wheel)
		node.removeEventListener('keydown', on_key)

		slides.forEach(strip)
		node.replaceChildren(...slides)

		for (const property of ['overflow', 'touch-action', 'cursor', 'user-select', '--slider-per-page']) {
			node.style.removeProperty(property)
		}
		for (const attribute of ['role', 'aria-roledescription', 'aria-label']) {
			node.removeAttribute(attribute)
		}
		if (keyboard) node.removeAttribute('tabindex')

		emit('sliderdestroy', {})
	}

	/* Init */

	node.style.overflow = 'hidden'
	node.style.touchAction = 'pan-y'
	if (!auto) node.style.setProperty('--slider-per-page', String(pages))
	if (draggable) node.style.cursor = 'grab'
	if (rtl) track.style.direction = 'rtl'

	node.setAttribute('role', 'region')
	node.setAttribute('aria-roledescription', 'carousel')
	node.setAttribute('aria-label', label)
	if (keyboard) node.setAttribute('tabindex', '0')
	// An auto-rotating carousel must not announce every change; a manual one should.
	if (!autoplay) track.setAttribute('aria-live', 'polite')

	track.style.display = 'flex'
	track.style.willChange = 'transform'
	node.replaceChildren(track)
	// Measured before the first build, which needs the track's width to place the slides.
	width = track.clientWidth
	build()

	node.addEventListener('pointerdown', on_down)
	node.addEventListener('pointermove', on_move)
	node.addEventListener('pointerup', on_up)
	node.addEventListener('pointercancel', on_cancel)
	// Not passive: a horizontal gesture has to be preventable to stay out of the page's hands.
	if (wheel) node.addEventListener('wheel', on_wheel, { passive: false })
	if (keyboard) node.addEventListener('keydown', on_key)
	document.addEventListener('visibilitychange', on_visibility)
	motion?.addEventListener('change', on_motion_change)
	observer.observe(node)
	start()

	// Deferred so listeners attached straight after this call still see it.
	queueMicrotask(() => {
		if (!destroyed) emit('sliderinit', { index, per_page: pages, length: slides.length })
	})

	return {
		get index() {
			return index
		},
		get length() {
			return slides.length
		},
		get per_page() {
			return pages
		},
		get max() {
			return max_index()
		},
		next,
		prev,
		go_to,
		insert,
		remove,
		prepend: item => insert(item, 0),
		append: item => insert(item, slides.length),
		play,
		pause,
		update,
		destroy
	}
}

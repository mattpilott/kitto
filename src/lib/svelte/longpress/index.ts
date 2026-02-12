const THRESHOLD = 10 // pixels

/**
 * @module longpress
 * @group Svelte
 * @version 1.3.0
 * @remarks Action to longpress on an element. Fires when the pointer has been held
 * for `duration` ms without moving beyond the threshold. Dispatches `longpressrevoke`
 * when the end event shows the press was short so consumers can close UI. Restarts
 * the hold timer on visual viewport resize (e.g. keyboard open/close) to avoid false
 * triggers. Ignores synthesized mouse events after touch interactions to prevent
 * double-firing on iOS.
 *
 * @param node - The node to listen to
 * @param duration - Hold duration in milliseconds (default 800)
 * @example <button use:longpress={800} on:longpress={open} on:longpressrevoke={close}>
 */
export function longpress(node: HTMLElement, duration: number = 800): { destroy: () => void } {
	let timer: number | undefined
	let did_dispatch = false
	let start_timestamp = 0
	let start_x = 0
	let start_y = 0
	let last_x = 0
	let last_y = 0
	let had_touch = false

	function get_coords(event: MouseEvent | TouchEvent): { x: number; y: number } {
		if ('touches' in event && event.touches.length) {
			return { x: event.touches[0].clientX, y: event.touches[0].clientY }
		}
		return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY }
	}

	function clear_timer() {
		if (timer !== undefined) {
			clearTimeout(timer)
			timer = undefined
		}
	}

	function fire() {
		timer = undefined
		did_dispatch = true
		node.dispatchEvent(
			new CustomEvent('longpress', {
				detail: { x: last_x, y: last_y }
			})
		)
	}

	function arm() {
		clear_timer()
		timer = window.setTimeout(fire, duration)
	}

	function on_viewport_resize() {
		if (timer !== undefined) {
			arm()
		}
	}

	function add_viewport_listener() {
		window.visualViewport?.addEventListener('resize', on_viewport_resize)
	}

	function remove_viewport_listener() {
		window.visualViewport?.removeEventListener('resize', on_viewport_resize)
	}

	function start(event: MouseEvent | TouchEvent) {
		if ('touches' in event) {
			had_touch = true
		} else if (had_touch) {
			return
		}
		if (event.type === 'mousedown' && 'button' in event && event.button !== 0) return

		did_dispatch = false
		start_timestamp = event.timeStamp
		const coords = get_coords(event)
		start_x = last_x = coords.x
		start_y = last_y = coords.y

		arm()
		add_viewport_listener()
	}

	function cancel() {
		clear_timer()
		remove_viewport_listener()
		setTimeout(() => {
			had_touch = false
		}, 1000)
	}

	function move(event: MouseEvent | TouchEvent) {
		if (timer === undefined) return

		const coords = get_coords(event)
		last_x = coords.x
		last_y = coords.y

		if (Math.abs(coords.x - start_x) > THRESHOLD || Math.abs(coords.y - start_y) > THRESHOLD) {
			cancel()
		}
	}

	function end(event: MouseEvent | TouchEvent) {
		if (event.type === 'mouseup' && had_touch) return
		remove_viewport_listener()

		if (!did_dispatch) {
			clear_timer()
			return
		}

		const elapsed = event.timeStamp - start_timestamp
		if (elapsed < duration) {
			node.dispatchEvent(new CustomEvent('longpressrevoke'))
		}
		clear_timer()
	}

	node.addEventListener('touchstart', start, { passive: true })
	node.addEventListener('touchmove', move, { passive: true })
	node.addEventListener('touchend', end)
	node.addEventListener('touchcancel', cancel)
	node.addEventListener('mousedown', start)
	node.addEventListener('mousemove', move)
	node.addEventListener('mouseup', end)

	return {
		destroy() {
			clear_timer()
			remove_viewport_listener()
			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchmove', move)
			node.removeEventListener('touchend', end)
			node.removeEventListener('touchcancel', cancel)
			node.removeEventListener('mousedown', start)
			node.removeEventListener('mousemove', move)
			node.removeEventListener('mouseup', end)
		}
	}
}

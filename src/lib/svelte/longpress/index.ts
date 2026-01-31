const THRESHOLD = 10 // pixels

/**
 * @module longpress
 * @group Svelte
 * @version 1.2.0
 * @remarks Action to longpress on an element. Fires only when the pointer has been
 * held for `duration` ms and is still over the element (avoids opening on tap / when
 * pointer has moved off, e.g. iOS with keyboard). Dispatches `longpressrevoke` when
 * the end event shows the press was short so consumers can close UI.
 *
 * @param node - The node to listen to
 * @param duration - Hold duration in milliseconds (default 800)
 * @example <button use:longpress={800} on:longpress={open} on:longpressrevoke={close}>
 */
export function longpress(
	node: HTMLElement,
	duration: number = 800
): { destroy: () => void } {
	let timer: ReturnType<typeof window.setTimeout> | undefined
	let did_dispatch = false
	let start_timestamp = 0
	let start_x = 0
	let start_y = 0
	let last_x = 0
	let last_y = 0

	function get_coords(event: MouseEvent | TouchEvent): { x: number; y: number } {
		if ('touches' in event && event.touches.length) {
			return { x: event.touches[0].clientX, y: event.touches[0].clientY }
		}
		return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY }
	}

	function is_inside_node(x: number, y: number): boolean {
		const rect = node.getBoundingClientRect()
		return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
	}

	function clear_timer() {
		if (timer !== undefined) {
			clearTimeout(timer)
			timer = undefined
		}
	}

	function start(event: MouseEvent | TouchEvent) {
		if (event.type === 'mousedown' && 'button' in event && event.button !== 0) return

		clear_timer()
		did_dispatch = false
		start_timestamp = event.timeStamp
		const coords = get_coords(event)
		start_x = last_x = coords.x
		start_y = last_y = coords.y

		timer = window.setTimeout(() => {
			timer = undefined
			if (is_inside_node(last_x, last_y)) {
				did_dispatch = true
				node.dispatchEvent(
					new CustomEvent('longpress', {
						detail: { x: last_x, y: last_y }
					})
				)
			}
		}, duration)
	}

	function cancel() {
		clear_timer()
	}

	function move(event: MouseEvent | TouchEvent) {
		if (timer === undefined) return

		const coords = get_coords(event)
		last_x = coords.x
		last_y = coords.y

		if (
			Math.abs(coords.x - start_x) > THRESHOLD ||
			Math.abs(coords.y - start_y) > THRESHOLD ||
			!is_inside_node(coords.x, coords.y)
		) {
			cancel()
		}
	}

	function end(event: MouseEvent | TouchEvent) {
		if (!did_dispatch) {
			clear_timer()
			return
		}
		const elapsed = event.timeStamp - start_timestamp
		// Only revoke when the press was short. Don't revoke for "left target" –
		// when the keyboard closes the layout shifts so the release position can
		// appear outside the moved element and wrongly close the menu.
		if (elapsed < duration) {
			node.dispatchEvent(new CustomEvent('longpressrevoke'))
		}
		clear_timer()
	}

	node.addEventListener('touchstart', start, { passive: true })
	node.addEventListener('touchmove', move, { passive: true })
	node.addEventListener('touchend', end)
	node.addEventListener('mousedown', start)
	node.addEventListener('mousemove', move)
	node.addEventListener('mouseup', end)

	return {
		destroy() {
			clear_timer()
			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchmove', move)
			node.removeEventListener('touchend', end)
			node.removeEventListener('mousedown', start)
			node.removeEventListener('mousemove', move)
			node.removeEventListener('mouseup', end)
		}
	}
}

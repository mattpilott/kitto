/**
 * @module longpress
 * @group Svelte
 * @version 1.1.3
 * @remarks Action to longpress on an element
 *
 * @param node - The node to listen to
 * @param duration - Duration of the longpress in milliseconds
 * @example <button use:longpress={1000} on:longpress={() => alert("longpress")}>
 */
export function longpress(node: HTMLElement, duration: number = 500): { destroy: () => void } {
	let timer: ReturnType<typeof window.setTimeout> | number
	let is_pressed = false
	let start_y = 0
	let start_x = 0

	const threshold = 10 // pixels

	function start(event: MouseEvent | TouchEvent) {
		// Prevent unwanted context menu
		if (event.type === 'mousedown' && 'button' in event && event.button !== 0) return

		is_pressed = true
		if ('touches' in event) {
			start_y = event.touches[0].clientY
			start_x = event.touches[0].clientX
		} else {
			start_y = event.clientY
			start_x = event.clientX
		}

		// Use `setTimeout` to detect longpress
		timer = window.setTimeout(() => {
			if (!is_pressed) return

			node.dispatchEvent(
				new CustomEvent('longpress', {
					detail: {
						x: 'touches' in event ? event.touches[0].clientX : event.clientX,
						y: 'touches' in event ? event.touches[0].clientY : event.clientY
					}
				})
			)
		}, duration)
	}

	function cancel() {
		is_pressed = false
		clearTimeout(timer)
	}

	function move(event: MouseEvent | TouchEvent) {
		if (!is_pressed) return

		const current_y = 'touches' in event ? event.touches[0].clientY : event.clientY
		const current_x = 'touches' in event ? event.touches[0].clientX : event.clientX
		const delta_y = Math.abs(current_y - start_y)
		const delta_x = Math.abs(current_x - start_x)

		// Cancel if moved more than threshold in any direction
		if (delta_y > threshold || delta_x > threshold) cancel()
	}

	node.addEventListener('mousedown', start)
	node.addEventListener('mouseup', cancel)
	node.addEventListener('mousemove', move)

	// Add touch support
	node.addEventListener('touchstart', start)
	node.addEventListener('touchend', cancel)
	node.addEventListener('touchmove', move)

	return {
		destroy() {
			cancel()

			node.removeEventListener('mousedown', start)
			node.removeEventListener('mouseup', cancel)
			node.removeEventListener('mousemove', move)

			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchend', cancel)
			node.removeEventListener('touchmove', move)
		}
	}
}

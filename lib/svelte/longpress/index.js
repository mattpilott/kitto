/**
 * @module longpress
 * @description Action to longpress on an element
 * @memberof Svelte
 * @version 1.0.1
 * @param {object} node The node to listen to
 * @param {number} duration Duration of the longpress
 * @example <button use:longpress={1000} on:longpress={() => alert("longpress")}>
 */
export function longpress(node, duration = 500) {
	let timer
	let isPressed = false

	function start(event) {
		// Prevent unwanted context menu
		if (event.type === 'mousedown' && event.button !== 0) return

		isPressed = true
		event.preventDefault() // Prevent touch-based click events

		// Use `setTimeout` to detect longpress
		timer = window.setTimeout(() => {
			if (isPressed) {
				node.dispatchEvent(
					new CustomEvent('longpress', {
						detail: {
							x: event.touches ? event.touches[0].clientX : event.clientX,
							y: event.touches ? event.touches[0].clientY : event.clientY
						}
					})
				)
			}
		}, duration)
	}

	function cancel() {
		isPressed = false
		clearTimeout(timer)
	}

	node.addEventListener('mousedown', start)
	node.addEventListener('mouseup', cancel)
	node.addEventListener('mouseleave', cancel)

	// Add touch support
	node.addEventListener('touchstart', start)
	node.addEventListener('touchend', cancel)
	node.addEventListener('touchcancel', cancel)

	return {
		update(newDuration) {
			cancel()
			duration = newDuration
		},
		destroy() {
			cancel()
			node.removeEventListener('mousedown', start)
			node.removeEventListener('mouseup', cancel)
			node.removeEventListener('mouseleave', cancel)
			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchend', cancel)
			node.removeEventListener('touchcancel', cancel)
		}
	}
}

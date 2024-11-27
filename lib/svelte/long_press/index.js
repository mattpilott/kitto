/**
 * @module clickOut
 * @description Action to longpress on an element
 * @memberof Svelte
 * @version 1.0.0
 * @param {object} node The node to listen to
 * @param {number} duration Duration of the longpress
 * @example <button use:longpress={1000} on:longpress={() => alert("longpress")}>
 */
export function longpress(node, duration = 500) {
	let timer
	let isPressed = false

	function mouseDown(event) {
		// Ensure it's a left click (primary button)
		if (event.button !== 0) return

		isPressed = true
		timer = window.setTimeout(() => {
			if (isPressed) {
				node.dispatchEvent(
					new CustomEvent('longpress', {
						detail: { x: event.clientX, y: event.clientY }
					})
				)
			}
		}, duration)
	}

	function mouseUp() {
		isPressed = false
		clearTimeout(timer)
	}

	// Handle edge cases where mouse leaves the element
	function mouseLeave() {
		isPressed = false
		clearTimeout(timer)
	}

	node.addEventListener('mousedown', mouseDown)
	node.addEventListener('mouseup', mouseUp)
	node.addEventListener('mouseleave', mouseLeave)

	// Add touch support
	node.addEventListener('touchstart', mouseDown)
	node.addEventListener('touchend', mouseUp)
	node.addEventListener('touchcancel', mouseLeave)

	return {
		update(newDuration) {
			mouseUp()
			duration = newDuration
		},
		destroy() {
			mouseUp()
			node.removeEventListener('mousedown', mouseDown)
			node.removeEventListener('mouseup', mouseUp)
			node.removeEventListener('mouseleave', mouseLeave)
			node.removeEventListener('touchstart', mouseDown)
			node.removeEventListener('touchend', mouseUp)
			node.removeEventListener('touchcancel', mouseLeave)
		}
	}
}

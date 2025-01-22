/**
 * @module longpress
 * @description Action to longpress on an element
 * @memberof Svelte
 * @version 1.1.1
 * @param {object} node The node to listen to
 * @param {number} duration Duration of the longpress
 * @param {boolean} persist Whether to persist the longpress event even if the mouse leaves the element
 * @example <button use:longpress={1000} on:longpress={() => alert("longpress")}>
 * @example <button use:longpress={[1000, true]} on:longpress={() => alert("longpress")}>
 */
export function longpress(node, params) {
	let duration = 500
	let persist = false

	if (Array.isArray(params)) {
		;[duration, persist] = params
	} else if (typeof params === 'number') {
		duration = params
	}
	let timer
	let isPressed = false

	function start(event) {
		// Prevent unwanted context menu
		if (event.type === 'mousedown' && event.button !== 0) return

		isPressed = true

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
	persist && node.addEventListener('mouseleave', cancel)

	// Add touch support
	node.addEventListener('touchstart', start)
	node.addEventListener('touchend', cancel)
	persist && node.addEventListener('touchcancel', cancel)

	return {
		destroy() {
			cancel()

			node.removeEventListener('mousedown', start)
			node.removeEventListener('mouseup', cancel)
			persist && node.removeEventListener('mouseleave', cancel)

			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchend', cancel)
			persist && node.removeEventListener('touchcancel', cancel)
		}
	}
}

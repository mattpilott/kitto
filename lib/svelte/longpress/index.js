/**
 * @module longpress
 * @description Action to longpress on an element
 * @memberof Svelte
 * @version 1.1.3
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
	let startY = 0
	let startX = 0
	const threshold = 10 // pixels

	function start(event) {
		// Prevent unwanted context menu
		if (event.type === 'mousedown' && event.button !== 0) return

		isPressed = true
		if (event.touches) {
			startY = event.touches[0].clientY
			startX = event.touches[0].clientX
		} else {
			startY = event.clientY
			startX = event.clientX
		}

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

	function handleMove(event) {
		if (!isPressed) return

		const currentY = event.touches ? event.touches[0].clientY : event.clientY
		const currentX = event.touches ? event.touches[0].clientX : event.clientX
		const deltaY = Math.abs(currentY - startY)
		const deltaX = Math.abs(currentX - startX)

		// Cancel if moved more than threshold in any direction
		if (deltaY > threshold || deltaX > threshold) {
			cancel()
		}
	}

	node.addEventListener('mousedown', start)
	node.addEventListener('mouseup', cancel)
	node.addEventListener('mousemove', handleMove)

	// Add touch support
	node.addEventListener('touchstart', start)
	node.addEventListener('touchend', cancel)
	node.addEventListener('touchmove', handleMove)

	return {
		destroy() {
			cancel()

			node.removeEventListener('mousedown', start)
			node.removeEventListener('mouseup', cancel)
			node.removeEventListener('mousemove', handleMove)

			node.removeEventListener('touchstart', start)
			node.removeEventListener('touchend', cancel)
			node.removeEventListener('touchmove', handleMove)
		}
	}
}

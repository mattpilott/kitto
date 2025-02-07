/**
 * @module clickOut
 * @description Action to click outside
 * @memberof Svelte
 * @version 1.0.2
 * @param {object} node The node to listen to
 * @param {array} params Callback and elements to exclude from the click
 * @returns {function} The passed in callback
 * @example <div use:clickOut={[() => console.log('clickOut), document.querySelector('.exclude')]]}>
 */

export function clickOut(node, [callback, ...exclude]) {
	function handler(e) {
		e.stopPropagation()
		if (!callback) return
		if (!node.contains(e.target) && !exclude.some(item => item.contains(e.target))) {
			callback()
		}
	}

	const options = { capture: true, passive: true }

	document.addEventListener('click', handler, options)

	return {
		destroy() {
			document.removeEventListener('click', handler, options)
		}
	}
}

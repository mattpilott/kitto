/**
 * @module click_out
 * @group Svelte
 * @version 1.0.0
 * @remarks Action to click outside
 *
 * @param node - The node to listen to
 * @param params - Array: [callback, ...elements to exclude from the click]
 * @returns The passed in callback
 * @example
 *   <div use:click_out={[() => console.log('click_out'), document.querySelector('.exclude')]}></div>
 */
export function click_out(
	node: HTMLElement,
	[callback, ...exclude]: [() => void, ...Array<HTMLElement>]
): { destroy: () => void } {
	function handler({ target }: MouseEvent) {
		if (!callback) return
		if (
			target instanceof HTMLElement &&
			!node.contains(target) &&
			!exclude.some(item => item.contains(target))
		) {
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

/**
 * @module throttle
 * @remarks Throttles a function to run at most once every specified delay
 * @group Vanilla
 * @version 2.0.0
 *
 * @param fn - The function to throttle
 * @param delay - The minimum time between function calls in milliseconds
 * @returns A throttled version of the passed function
 * @example
 * ```ts
 * // Throttle a scroll event handler
 * const throttled_scroll = throttle(() => {
 *    console.log('Scroll event throttled');
 * }, 1000);
 *
 * // Add the throttled function as an event listener
 * window.addEventListener('scroll', throttled_scroll);
 *
 * // Now, the console will log at most once every 1000ms during scrolling
 * ```
 */
export function throttle(fn: (...args: unknown[]) => void, delay = 1) {
	let last_call_time = 0

	return function throttled(...args: unknown[]) {
		const now = Date.now()
		if (now - last_call_time >= delay) {
			fn.apply(this, args)
			last_call_time = now
		}
	} as (this: unknown, ...args: unknown[]) => void
}

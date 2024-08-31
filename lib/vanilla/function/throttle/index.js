/**
 * Throttles a function to run at most once every specified delay
 * @memberof Vanilla
 * @version 2.0.0
 * @param {Function} fn - The function to throttle
 * @param {number} delay - The minimum time between function calls in milliseconds
 * @returns {Function} A throttled version of the passed function
 * @example
 * // Throttle a scroll event handler
 * const throttledScroll = throttle(() => {
 *    console.log('Scroll event throttled');
 * }, 1000);
 *
 * // Add the throttled function as an event listener
 * window.addEventListener('scroll', throttledScroll);
 *
 * // Now, the console will log at most once every 1000ms during scrolling
 */
export function throttle(fn, delay) {
	let lastCallTime = 0

	return function throttled(...args) {
		const now = Date.now()
		if (now - lastCallTime >= delay) {
			fn.apply(this, args)
			lastCallTime = now
		}
	}
}

/**
 * @module sleep
 * @description Sleeps for a given number of milliseconds
 * @memberof Vanilla
 * @version 1.1.0
 * @param {number} ms - The number of milliseconds to sleep
 * @param {Function} [callback] - Optional callback function to run after sleep completes
 * @returns {Promise} A promise that resolves after the given number of milliseconds
 * @example
 * // Sleep for 1000 milliseconds
 * sleep(1000).then(() => {
 *    console.log('1 second has passed');
 * });
 *
 * // Sleep with callback
 * sleep(1000, () => {
 *    console.log('1 second has passed');
 * });
 */
export function sleep(ms, callback) {
	return new Promise(resolve => {
		setTimeout(() => {
			if (typeof callback === 'function') callback()
			resolve()
		}, ms)
	})
}

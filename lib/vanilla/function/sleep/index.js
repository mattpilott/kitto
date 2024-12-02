/**
 * @module sleep
 * @description Sleeps for a given number of milliseconds
 * @memberof Vanilla
 * @version 1.0.0
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise} A promise that resolves after the given number of milliseconds
 * @example
 * // Sleep for 1000 milliseconds
 * sleep(1000).then(() => {
 *    console.log('1 second has passed');
 * });
 */
export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

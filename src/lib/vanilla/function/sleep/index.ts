/**
 * @module sleep
 * @group Vanilla
 * @version 1.1.0
 * @remarks Sleeps for a given number of milliseconds
 *
 * @param ms - The number of milliseconds to sleep
 * @param callback - Optional callback function to run after sleep completes
 * @returns A promise that resolves after the given number of milliseconds
 * @example
 * ```ts
 * import { sleep } from 'kitto'
 *
 * // Sleep for 1000 milliseconds
 * sleep(1000).then(() => {
 *    console.log('1 second has passed');
 * });
 *
 * // Sleep with callback
 * sleep(1000, () => {
 *    console.log('1 second has passed');
 * });
 * ```
 */
export function sleep(ms: number, callback?: () => void): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			if (typeof callback === 'function') callback()
			resolve()
		}, ms)
	})
}

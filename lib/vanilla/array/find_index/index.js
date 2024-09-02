/**
 * @memberof Vanilla
 * @version 2.0.0
 * @description Finds the index of an object in an array that contains a specific key-value pair.
 *
 * @param {Array<Object>} arr - The array of objects to search through.
 * @param {string} key - The key to match in the objects.
 * @param {*} value - The value associated with the key to match.
 * @returns {number} - The index of the object that matches the key-value pair. Returns `-1` if no match is found.
 *
 * @example
 * // Example usage:
 * const data = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Joe' }
 * ];
 *
 * const resultIndex = findIndex(data, 'name', 'Jane');
 * console.log(resultIndex); // 1
 */
export function findIndex(arr, key, value) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]

		// Direct match check
		if (obj[key] === value) {
			return i
		}
	}

	return -1 // Return -1 if no match is found
}

/**
 * @memberof Vanilla
 * @version 2.0.0
 * @description Finds an object in an array that contains a specific key-value pair.
 *
 * @param {Array<Object>} arr - The array of objects to search through.
 * @param {string} key - The key to match in the objects.
 * @param {*} value - The value associated with the key to match.
 * @param {boolean} [recursive=false] - If true, the function will search recursively through nested objects and arrays.
 * @returns {Object|undefined} - The object that matches the key-value pair. Returns `undefined` if no match is found.
 *
 * @example
 * // Example usage:
 * const data = [
 *   {
 *     id: 1,
 *     name: 'John',
 *     children: [
 *       {
 *         id: 2,
 *         name: 'Jane',
 *         details: { key: 'info', value: 'targetValue' }
 *       },
 *       {
 *         id: 3,
 *         name: 'Joe'
 *       }
 *     ]
 *   }
 * ];
 *
 * const result = findObject(data, 'value', 'targetValue', true);
 * console.log(result); // { key: 'info', value: 'targetValue' }
 */
export function findObject(arr, key, value, recursive = false) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]

		// Direct match check
		if (obj[key] === value) {
			return obj
		}

		// Recursive search in nested arrays/objects
		if (recursive) {
			for (const k in obj) {
				const nested = obj[k]

				// If it's an array, recurse into it
				if (Array.isArray(nested)) {
					const result = findObject(nested, key, value, recursive)
					if (result) return result
				}
				// If it's an object, recurse into it
				else if (typeof nested === 'object' && nested !== null) {
					const result = findObject([nested], key, value, recursive)
					if (result) return result
				}
			}
		}
	}

	return undefined // Return undefined if no match is found
}

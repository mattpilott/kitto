/**
 * @memberof Vanilla
 * @version 2.0.0
 * @description Finds the index of an object in an array that contains a specific key-value pair.
 *
 * @param {Array<Object>} arr - The array of objects to search through.
 * @param {string} key - The key to match in the objects.
 * @param {*} value - The value associated with the key to match.
 * @param {boolean} [recursive=false] - If true, the function will search recursively through nested objects and arrays.
 * @param {boolean} [returnParent=false] - If true, the function returns the index of the parent object containing the matching object; otherwise, it returns the index of the matching object itself.
 * @returns {number} - The index of the object that matches the key-value pair, or the index of the parent object if `returnParent` is true. Returns `-1` if no match is found.
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
 * const resultIndex = findIndex(data, 'value', 'targetValue', true);
 * console.log(resultIndex); // 1
 *
 * const parentResultIndex = findIndex(data, 'value', 'targetValue', true, true);
 * console.log(parentResultIndex); // 0
 */
export function findIndex(arr, key, value, recursive = false, returnParent = false) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]

		// Direct match check
		if (obj[key] === value) {
			return i
		}

		// Recursive search in nested arrays/objects
		if (recursive) {
			for (const k in obj) {
				const nested = obj[k]

				// If it's an array, recurse into it
				if (Array.isArray(nested)) {
					const resultIndex = findIndex(nested, key, value, recursive, returnParent)
					if (resultIndex !== -1) {
						return returnParent ? i : resultIndex
					}
				}
				// If it's an object, recurse into it
				else if (typeof nested === 'object' && nested !== null) {
					const resultIndex = findIndex([nested], key, value, recursive, returnParent)
					if (resultIndex !== -1) {
						return returnParent ? i : resultIndex
					}
				}
			}
		}
	}

	return -1 // Return -1 if no match is found
}

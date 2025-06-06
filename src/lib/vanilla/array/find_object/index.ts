/**
 * @module find_object
 * @group Vanilla
 * @version 2.0.0
 * @remarks Finds an object in an array that contains a specific key-value pair.
 *
 * @param arr - The array of objects to search through
 * @param key - The key to match in the objects
 * @param value - The value associated with the key to match
 * @param recursive - If true, the function will search recursively through nested objects and arrays
 * @returns The object that matches the key-value pair, or undefined if no match is found
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
 * const result = find_object(data, 'value', 'targetValue', true);
 * console.log(result); // { key: 'info', value: 'targetValue' }
 */
export function find_object<T extends Record<string, unknown>>(
	arr: Array<T>,
	key: string | number,
	value: unknown,
	recursive = false
): T | undefined {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]

		// Direct match check
		if (obj[key] === value) return obj

		// Recursive search in nested arrays/objects
		if (recursive) {
			for (const k in obj) {
				const nested = obj[k]

				// If it's an array, recurse into it
				if (Array.isArray(nested)) {
					const result = find_object(nested, key, value, recursive)
					if (result) return result
				}
				// If it's an object, recurse into it
				else if (typeof nested === 'object' && nested !== null) {
					const result = find_object([nested as unknown as T], key, value, recursive)
					if (result) return result
				}
			}
		}
	}

	return undefined // Return undefined if no match is found
}

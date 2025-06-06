/**
 * Finds the index of an object in an array that contains a specific key-value pair.
 *
 * @remarks
 * This function is part of the array utilities module.
 *
 * @version 2.0.0
 *
 * @param arr - The array of objects to search through
 * @param key - The key to match in the objects
 * @param value - The value associated with the key to match
 * @returns The index of the object that matches the key-value pair. Returns `-1` if no match is found
 *
 * @example
 * ```ts
 * const data = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Joe' }
 * ];
 *
 * const result_index = find_index(data, 'name', 'Jane');
 * console.log(result_index); // 1
 * ```
 */
export function find_index<T extends Record<string | number, unknown>>(
	arr: Array<T>,
	key: keyof T,
	value: T[keyof T]
) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]

		// Direct match check
		if (obj[key] === value) return i
	}

	return -1 // Return -1 if no match is found
}

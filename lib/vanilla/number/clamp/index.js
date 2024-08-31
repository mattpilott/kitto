/**
 * Clamps a value between an inclusive range.
 * @memberof Vanilla
 * @version 2.0.0
 * @param {number} val - The input value to be clamped.
 * @param {number} min - The lower boundary of the range.
 * @param {number} max - The upper boundary of the range.
 * @returns {number} The clamped value.
 * @throws {Error} If min is greater than max.
 * @example
 * clamp(10, 0, 5);  // Returns 5
 * clamp(-5, 0, 5);  // Returns 0
 * clamp(3, 0, 5);   // Returns 3
 */
export function clamp(val, min, max) {
	if (min > max) {
		throw new Error('Min value must be less than or equal to max value')
	}
	return Math.min(Math.max(val, min), max)
}

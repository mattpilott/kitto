/**
 * @module clamp
 * @group Vanilla
 * @version 2.0.0
 * @remarks Clamps a value between an inclusive range.
 *
 * @param val - The input value to be clamped.
 * @param min - The lower boundary of the range.
 * @param max - The upper boundary of the range.
 * @returns The clamped value.
 * @throws If min is greater than max.
 * @example
 * ```ts
 * clamp(10, 0, 5);  // Returns 5
 * clamp(-5, 0, 5);  // Returns 0
 * clamp(3, 0, 5);   // Returns 3
 * ```
 */
export function clamp(val: number, min: number, max: number): number {
	if (min > max) throw new Error('Min value must be less than or equal to max value')

	return Math.min(Math.max(val, min), max)
}

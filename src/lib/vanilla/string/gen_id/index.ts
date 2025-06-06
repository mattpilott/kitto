/**
 * @module gen_id
 * @group Vanilla
 * @version 3.0.0
 * @remarks Creates a universally unique identifier (UUID v4) using the fastest available method
 *
 * @returns A UUID v4 string
 */
export function gen_id(): string {
	// Use native randomUUID if available (fastest method Safari 15.4+)
	if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

	// @ts-expect-error - Fallback for older browsers (Safari 6+)
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	)
}

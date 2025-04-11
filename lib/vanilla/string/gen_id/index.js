/**
 * @module genID
 * @description Creates a universally unique identifier (UUID v4) using the fastest available method
 * @memberof Vanilla
 * @version 3.0.0
 * @returns {string} A UUID v4 string
 */
export function genID() {
	// Use native randomUUID if available (fastest method Safari 15.4+)
	if (typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}

	// Fallback for older browsers (Safari 6+)
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	)
}

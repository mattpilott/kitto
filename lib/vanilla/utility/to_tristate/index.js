/**
 * Returns a tristate value.
 * @memberof vanilla
 * @version 1.0.0
 * @returns {-1|0|1} Returns 1, 0 or -1
 */

export function toTristate(val) {
	if (val === undefined || val === null) return 0
	if (val === false) return -1
	if (val === true) return 1

	// If the value is not undefined, null, true, or false, throw an error
	throw new Error(`Invalid argument: ${val}. Expected undefined, null, true, or false.`)
}

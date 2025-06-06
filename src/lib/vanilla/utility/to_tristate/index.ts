/**
 * @module to_tristate
 * @group Vanilla
 * @version 1.0.0
 * @remarks Returns a tristate value.
 *
 * @param val - The value to convert to a tristate
 * @returns The tristate value
 */

export function to_tristate(val: undefined | null | boolean): number {
	if (val === undefined || val === null) return 0
	if (val === false) return -1
	if (val === true) return 1

	// If the value is not undefined, null, true, or false, throw an error
	throw new Error(`Invalid argument: ${val}. Expected undefined, null, true, or false.`)
}

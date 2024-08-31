/**
 * Takes a string and converts it to sentence or title case.
 * @memberof Vanilla
 * @version 2.0.0
 * @param {string} str - The string to convert.
 * @param {boolean} toTitleCase - If true, converts the string to title case. Otherwise, converts to sentence case.
 * @returns {string} The converted string.
 */

export function formatString(str, toTitleCase) {
	const format = toTitleCase ? /(\b[a-z](?!\s))/g : /^.|(\. .)/g
	str = str.toLowerCase()
	str = str.replace(/(\n)|(\f)/g, ' ')
	str = str.replace(format, char => char.toUpperCase())

	return str
}

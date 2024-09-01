/**
 * @memberof Vanilla
 * @version 2.1.3
 * @description Takes a string and converts it to sentence or title case.
 * @param {string} str - The string to convert.
 * @param {boolean} toTitleCase - If true, converts the string to title case. Otherwise, converts to sentence case.
 * @returns {string} The converted string.
 */
export function formatString(str, toTitleCase) {
	const smallWords = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|so|the|to|up|yet|is)$/i

	// Function to capitalize the first letter of a word
	const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

	// Function to format a single sentence
	const formatSentence = sentence => {
		return sentence
			.split(/\s+/)
			.map((word, index) => {
				if (toTitleCase) {
					return index === 0 || !smallWords.test(word) ? capitalize(word) : word.toLowerCase()
				} else {
					return index === 0 ? capitalize(word) : word.toLowerCase()
				}
			})
			.join(' ')
	}

	// Split the string into sentences and format each one
	return str
		.split(/([.!?]\s+)/)
		.map((part, index) => {
			return index % 2 === 0 ? formatSentence(part) : part
		})
		.join('')
}

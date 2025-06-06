/**
 * @module format_string
 * @group Vanilla
 * @version 3.0.0
 * @remarks Takes a string and converts it to sentence or title case.
 *
 * @param str - The string to convert.
 * @param to_title_case - If true, converts the string to title case. Otherwise, converts to sentence case.
 * @returns The converted string.
 */
export function format_string(str: string, to_title_case = false): string {
	const small_words = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|so|the|to|up|yet|is)$/i

	// Function to capitalize the first letter of a word
	const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

	// Function to format a single sentence
	const format_sentence = (sentence: string) => {
		return sentence
			.split(/\s+/)
			.map((word, index) => {
				if (to_title_case) {
					return index === 0 || !small_words.test(word) ? capitalize(word) : word.toLowerCase()
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
			return index % 2 === 0 ? format_sentence(part) : part
		})
		.join('')
}

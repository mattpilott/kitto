/**
 * @module format_string
 * @group Vanilla
 * @version 4.0.0
 * @remarks Takes a string and converts it to sentence case, title case, or slug format.
 *
 * @param str - The string to convert.
 * @param format - The format to apply: "sentence" (default), "title", or "slug".
 * @returns The converted string.
 */
export function format_string(str: string, format: 'sentence' | 'title' | 'slug' | true = 'sentence'): string {
	if (format === true) {
		console.warn(
			'format_string: The boolean parameter is deprecated. Use format: "sentence" | "title" | "slug" instead.'
		)
	}
	const small_words = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|so|the|to|up|yet|is)$/i

	// Function to capitalize the first letter of a word
	const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

	// Function to create a slug from a word
	const slugify = (word: string) => {
		return word
			.toLowerCase()
			.replace(/[^a-z0-9\s_-]/g, ' ') // Replace special characters with spaces
			.replace(/[_\s]+/g, '-') // Replace underscores and spaces with dashes
			.replace(/-+/g, '-') // Replace multiple dashes with single dash
			.replace(/^-|-$/g, '') // Remove leading/trailing dashes
	}

	// For slug format, process the entire string as one unit
	if (format === 'slug') {
		return slugify(str)
	}

	// Function to format a single sentence
	const format_sentence = (sentence: string) => {
		return sentence
			.split(/\s+/)
			.map((word, index) => {
				if (format === 'title' || format === true) {
					return index === 0 || !small_words.test(word) ? capitalize(word) : word.toLowerCase()
				} else {
					// sentence case
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

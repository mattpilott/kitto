import fs from 'fs'
import path from 'path'

/**
 * @module prependCSS
 * @description
 * Custom Vite plugin to automatically add an `@import` statement in CSS files.
 * This plugin ensures that the specified CSS path is imported at the beginning of
 * each CSS file, after any `@charset` or `@layer` declarations.
 *
 * @version 1.0.0
 *
 * @param {string} importPath - The relative path to the CSS file that should be imported.
 * @returns  {Object} A Vite plugin object with `name`, `enforce`, `handleHotUpdate`, and `transform` hooks.
 *
 * @example
 * // Add a custom media import at the beginning of each CSS file
 * import { prependCSS } from 'kitto';
 *
 * export default {
 *   plugins: [
 *     prependCSS('./src/styles/media.css')
 *   ]
 * }
 */
export function prependCSS(importPath) {
	// Check if the file exists
	const resolvedPath = path.resolve(importPath)
	if (!fs.existsSync(resolvedPath)) {
		console.warn(
			`Warning: The file at path "${resolvedPath}" does not exist. The @import statement may not work as expected.`
		)
		return
	}

	return {
		name: 'prependCSS',
		enforce: 'pre',

		/**
		 * @description
		 * Handles hot updates by restarting the server if the file matches the specified path.
		 *
		 * @param {Object} context - The hot update context provided by Vite.
		 * @param {string} context.file - The file that was changed.
		 * @param {Object} context.server - The Vite development server instance.
		 */
		handleHotUpdate({ file, server }) {
			const tidyPath = importPath.replace(/^(\.\/|\.\.\/)+/, '')
			if (file.includes(tidyPath)) server.restart()
		},

		/**
		 * @description
		 * Transforms the CSS code by injecting an `@import` rule at the correct position.
		 *
		 * @param {string} code - The original CSS code.
		 * @param {string} id - The identifier of the file being transformed.
		 * @returns {string} The transformed CSS code with the `@import` rule inserted.
		 */
		transform(code, id) {
			if (id.endsWith('.css')) {
				const parts = code.split('\n')
				let insertIndex = 0

				// Skip @charset and @layer statements
				for (const part of parts) {
					const trimmedPart = part.trim()
					if (trimmedPart.startsWith('@charset') || trimmedPart.startsWith('@layer')) {
						insertIndex++
					} else {
						break
					}
				}

				// Insert the @import rule
				parts.splice(insertIndex, 0, `@import '${importPath}';`)

				return parts.join('\n')
			}
		}
	}
}

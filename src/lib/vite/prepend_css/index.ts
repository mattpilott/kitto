import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * @module prepend_css
 * @group Vite
 * @version 1.0.0
 * @remarks
 * Custom Vite plugin to automatically add an `@import` statement in CSS files.
 * This plugin ensures that the specified CSS path is imported at the beginning of
 * each CSS file, after any `@charset` or `@layer` declarations.
 *
 * @param import_path - The relative path to the CSS file that should be imported.
 * @returns A Vite plugin object with `name`, `enforce`, `handleHotUpdate`, and `transform` hooks.
 *
 * @example
 * ```ts
 * // Add a custom media import at the beginning of each CSS file
 * import { prepend_css } from 'kitto/vite';
 *
 * export default {
 *   plugins: [
 *     prepend_css('./src/styles/media.css')
 *   ]
 * }
 * ```
 */
export function prepend_css(import_path: string): Plugin {
	const plugin = {
		name: 'prepend_css',
		enforce: 'pre'
	} as const

	// Check if the file exists
	const resolved_path = path.resolve(import_path)
	if (!fs.existsSync(resolved_path)) {
		console.warn(
			`Warning: The file at path "${resolved_path}" does not exist. The @import statement may not work as expected.`
		)
		return plugin
	}

	return {
		...plugin,

		handleHotUpdate({ file, server }) {
			const tidy_path = import_path.replace(/^(\.\/|\.\.\/)+/, '')
			if (file.includes(tidy_path)) server.restart()
		},

		/**
		 * @remarks
		 * Transforms the CSS code by injecting an `@import` rule at the correct position.
		 *
		 * @param code - The original CSS code.
		 * @param id - The identifier of the file being transformed.
		 * @returns The transformed CSS code with the `@import` rule inserted.
		 */
		transform(code, id) {
			if (id.endsWith('.css')) {
				const parts = code.split('\n')
				let insert_index = 0

				// Skip @charset and @layer statements
				for (const part of parts) {
					const trimmed_part = part.trim()
					if (trimmed_part.startsWith('@charset') || trimmed_part.startsWith('@layer')) {
						insert_index++
					} else {
						break
					}
				}

				// Insert the @import rule
				parts.splice(insert_index, 0, `@import '${import_path}';`)

				return parts.join('\n')
			}
		}
	}
}

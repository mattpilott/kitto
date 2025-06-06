import type { Plugin } from 'vite'

/**
 * @module outwatch
 * @group Vite
 * @version 1.0.0
 * @remarks
 * This plugin will restart the server when a file is changed.
 * This is useful for files that are not imported by the app.
 * For example, if you have a file that is used by a serverless function.
 *
 * @param files - The file to watch for changes. Can be a string or an array of strings.
 * @param fullreload - If true, the server will be fully reloaded. If false/omitted, the server will be restarted.
 * @returns The plugin.
 *
 * @example
 * ```ts
 * // vite.config.js
 * import { outwatch } from 'kitto/vite'
 *
 * export default {
 *   plugins: [
 *     outwatch('src/functions/my-function.js')
 *   ]
 * }
 * ```
 * @example
 * ```ts
 * // vite.config.js
 * import { outwatch } from 'kitto/vite'
 *
 * export default {
 *   plugins: [
 *     outwatch(['.ts', '.js'])
 *   ]
 * }
 * ```
 * @example
 * // vite.config.js
 * import { outwatch } from 'kitto/vite'
 * // the second argument is a boolean that determines if the server should be fully reloaded or just restarted
 * export default {
 *   plugins: [
 *     outwatch(['.ts', '.js'], true)
 *   ]
 * }
 * ```
 */
export function outwatch(files: string | Array<string>, fullreload: boolean): Plugin {
	return {
		name: 'outwatch',

		handleHotUpdate({ file, server }) {
			if (Array.isArray(files) ? files.some(f => file.endsWith(f)) : file.endsWith(files)) {
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				fullreload ? server.ws.send({ type: 'full-reload' }) : server.restart()
			}
		}
	}
}

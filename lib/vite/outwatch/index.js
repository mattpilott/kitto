/**
 * @memberof Vite
 * @version 1.0.0
 * This plugin will restart the server when a file is changed.
 * This is useful for files that are not imported by the app.
 * For example, if you have a file that is used by a serverless function.
 *
 * @param {Array<String>} files - The file to watch for changes. Can be a string or an array of strings.
 * @param {Boolean} fullreload - If true, the server will be fully reloaded. If false/omitted, the server will be restarted.
 * @returns The plugin.
 *
 * @example
 * // vite.config.js
 * import { restarter } from '@neuekit/utils'
 *
 * export default {
 *   plugins: [
 *     restarter('src/functions/my-function.js')
 *   ]
 * }
 *
 * @example
 * // vite.config.js
 * import { restarter } from '@neuekit/utils'
 *
 * export default {
 *   plugins: [
 *     restarter(['.ts', '.js'])
 *   ]
 * }
 *  *
 * @example
 * // vite.config.js
 * import { restarter } from '@neuekit/utils'
 * // the second argument is a boolean that determines if the server should be fully reloaded or just restarted
 * export default {
 *   plugins: [
 *     restarter(['.ts', '.js'], true)
 *   ]
 * }
 */
export function outwatch(files, fullreload) {
	return {
		name: 'restarter',

		handleHotUpdate({ file, server }) {
			if (Array.isArray(files) ? files.some(f => file.endsWith(f)) : file.endsWith(files)) {
				fullreload ? server.ws.send({ type: 'full-reload' }) : server.restart()
			}
		}
	}
}

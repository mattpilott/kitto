/**
 * @module cookie
 * @group Vanilla
 * @version 2.2.0
 * @remarks
 * A lightweight, easy-to-use cookie management module for client-side JavaScript.
 * This module provides functions for getting, setting, and removing cookies, as well as
 * utilities for working with JSON data and checking browser cookie support.
 *
 * @example
 * ```ts
 * import cookie from 'kitto';
 *
 * // Set a cookie
 * cookie.set('user', { id: 123, name: 'John' }, { expires: 7 });
 *
 * // Get a cookie
 * const user = cookie.get('user', true); // true to parse JSON
 *
 * // Remove a cookie
 * cookie.remove('user');
 *
 * // Check if cookies are enabled
 * if (cookie.is_enabled()) {
 *   console.log('Cookies are supported and enabled');
 * }
 * ```
 */

/**
 * Get a cookie value by name
 * @param name - The name of the cookie to retrieve
 * @param parse_json - Whether to parse the value as JSON
 * @returns The cookie value, parsed as JSON if specified, or null if not found
 * @example
 * ```ts
 * // Get a simple cookie
 * const user_id = cookie.get('user_id');
 *
 * // Get and parse a JSON cookie
 * const user_object = cookie.get('user', true);
 * ```
 */
function get(name: string, parse_json: boolean = false): string | null {
	if (typeof document === 'undefined') return null
	const value = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop()
	if (!value) return null
	const decoded = decodeURIComponent(value)
	return parse_json ? JSON.parse(decoded) : decoded
}

/**
 * Set a cookie
 * @param name - The name of the cookie to set
 * @param value - The value to set
 * @param options - Cookie options
 * @param options.expires - Expiration date or number of days until expiry
 * @param options.path - The path for the cookie
 * @param options.sameSite - SameSite attribute for the cookie
 * @param options.encode - Whether to encode the value before setting
 * @example
 * ```ts
 * // Set a simple cookie that expires in 7 days
 * cookie.set('user_id', '123', { expires: 7 });
 *
 * // Set a JSON cookie with a specific expiration date
 * cookie.set('user', { id: 123, name: 'John' }, { expires: new Date('2023-12-31') });
 *
 * // Set a session cookie (expires when browser is closed)
 * cookie.set('session_id', 'abc123');
 * ```
 */
function set(
	name: string,
	value: string | Record<string, unknown> | number,
	options: { expires?: number | Date; path?: string; sameSite?: string; encode?: boolean } = {}
): void {
	if (typeof document === 'undefined') return
	const { expires, path = '/', sameSite = 'Lax', encode = true } = options
	const string_value = typeof value === 'object' ? JSON.stringify(value) : value
	const encoded_name = encode ? encodeURIComponent(name) : name
	const encoded_value = encode ? encodeURIComponent(string_value) : string_value
	const cookie_parts = [`${encoded_name}=${encoded_value}`, `path=${path}`, `sameSite=${sameSite}`]

	if (expires) {
		const expiryDate = expires instanceof Date ? expires : new Date(Date.now() + expires * 864e5)
		cookie_parts.push(`expires=${expiryDate.toUTCString()}`)
	}

	document.cookie = cookie_parts.join('; ')
}

/**
 * Remove a cookie
 * @param name - The name of the cookie to remove
 * @param path - The path for the cookie
 * @example
 * ```ts
 * // Remove a cookie
 * cookie.remove('userId');
 * ```
 */
function remove(name: string, path: string = '/'): void {
	set(name, '', { expires: new Date(0), path })
}

/**
 * Get all cookies as an object
 * @returns An object containing all cookies
 * @example
 * ```ts
 * // Get all cookies
 * const all_cookies = cookie.get_all();
 * console.log(all_cookies); // { userId: '123', sessionId: 'abc123', ... }
 * ```
 */
function get_all(): Record<string, string> {
	if (typeof document === 'undefined') return {}
	return Object.fromEntries(document.cookie.split(';').map(c => c.trim().split('=').map(decodeURIComponent)))
}

/**
 * Remove all cookies
 * @example
 * ```ts
 * // Remove all cookies
 * cookie.remove_all();
 * ```
 */
function remove_all(): void {
	Object.keys(get_all()).forEach(name => remove(name))
}

/**
 * Check if cookies are enabled in the browser
 * @returns True if cookies are enabled, false otherwise
 * @example
 * ```ts
 * // Check if cookies are enabled
 * if (cookie.is_enabled()) {
 *   console.log('Cookies are enabled');
 * } else {
 *   console.log('Cookies are disabled');
 * }
 * ```
 */
function is_enabled(): boolean {
	if (typeof document === 'undefined') return false
	const test = 'test'
	set(test, test)
	const enabled = get(test) === test
	remove(test)
	return enabled
}

/**
 * Parse Set-Cookie headers and call a callback for each cookie
 * @param set_cookies - Array of Set-Cookie header strings
 * @param callback - Function to call for each parsed cookie
 * @example
 * ```ts
 * // Parse Set-Cookie headers
 * const set_cookies = [
 *   'session=abc123; Path=/; HttpOnly; Secure',
 *   'user=john; Expires=Wed, 21 Oct 2023 07:28:00 GMT'
 * ];
 * cookie.parse(set_cookies, (name, value, options) => {
 *   console.log(name, value, options);
 * });
 * ```
 */
function parse(
	set_cookies: Array<string>,
	callback: (name: string, value: string, options: Record<string, string>) => void
): void {
	for (const header of set_cookies) {
		const [cookie_value, ...option_parts] = header.split(';')
		const [name, value] = cookie_value.trim().split('=')
		const options: Record<string, string> = {}

		for (const part of option_parts) {
			const [key, val] = part.trim().split('=')
			options[key.toLowerCase()] = val || 'true'
		}

		callback(name, value, options)
	}
}

export const cookie = {
	get,
	set,
	remove,
	get_all,
	getAll: get_all,
	remove_all,
	removeAll: remove_all,
	is_enabled,
	isEnabled: is_enabled,
	parse
}

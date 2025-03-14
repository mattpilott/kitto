/**
 * @module cookie
 * @description A lightweight, easy-to-use cookie management module for client-side JavaScript.
 * This module provides functions for getting, setting, and removing cookies, as well as
 * utilities for working with JSON data and checking browser cookie support.
 *
 * @version 2.1.0
 * @memberof Vanilla
 *
 * @example
 * import cookie from 'kitto/cookie';
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
 * if (cookie.isEnabled()) {
 *   console.log('Cookies are supported and enabled');
 * }
 */

/**
 * Get a cookie value by name
 * @param {string} name - The name of the cookie to retrieve
 * @param {boolean} [parseJSON=false] - Whether to parse the value as JSON
 * @returns {string|object|null} The cookie value, parsed as JSON if specified, or null if not found
 * @example
 * // Get a simple cookie
 * const userId = cookie.get('userId');
 *
 * // Get and parse a JSON cookie
 * const userObject = cookie.get('user', true);
 */
function get(name, parseJSON = false) {
	if (typeof document === 'undefined') return null
	const value = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop()
	if (!value) return null
	const decoded = decodeURIComponent(value)
	return parseJSON ? JSON.parse(decoded) : decoded
}

/**
 * Set a cookie
 * @param {string} name - The name of the cookie to set
 * @param {string|object} value - The value to set
 * @param {object} [options={}] - Cookie options
 * @param {number|Date} [options.expires] - Expiration date or number of days until expiry
 * @param {string} [options.path='/'] - The path for the cookie
 * @param {string} [options.sameSite='Lax'] - SameSite attribute for the cookie
 * @example
 * // Set a simple cookie that expires in 7 days
 * cookie.set('userId', '123', { expires: 7 });
 *
 * // Set a JSON cookie with a specific expiration date
 * cookie.set('user', { id: 123, name: 'John' }, { expires: new Date('2023-12-31') });
 *
 * // Set a session cookie (expires when browser is closed)
 * cookie.set('sessionId', 'abc123');
 */
function set(name, value, options = {}) {
	if (typeof document === 'undefined') return
	const { expires, path = '/', sameSite = 'Lax' } = options
	const stringValue = typeof value === 'object' ? JSON.stringify(value) : value
	const cookieParts = [
		`${encodeURIComponent(name)}=${encodeURIComponent(stringValue)}`,
		`path=${path}`,
		`sameSite=${sameSite}`
	]

	if (expires) {
		const expiryDate = expires instanceof Date ? expires : new Date(Date.now() + expires * 864e5)
		cookieParts.push(`expires=${expiryDate.toUTCString()}`)
	}

	document.cookie = cookieParts.join('; ')
}

/**
 * Remove a cookie
 * @param {string} name - The name of the cookie to remove
 * @example
 * // Remove a cookie
 * cookie.remove('userId');
 */
function remove(name, path = '/') {
	set(name, '', { expires: new Date(0), path })
}

/**
 * Get all cookies as an object
 * @returns {object} An object containing all cookies
 * @example
 * // Get all cookies
 * const allCookies = cookie.getAll();
 * console.log(allCookies); // { userId: '123', sessionId: 'abc123', ... }
 */
function getAll() {
	if (typeof document === 'undefined') return {}
	return Object.fromEntries(document.cookie.split(';').map(c => c.trim().split('=').map(decodeURIComponent)))
}

/**
 * Remove all cookies
 * @example
 * // Remove all cookies
 * cookie.removeAll();
 */
function removeAll() {
	Object.keys(getAll()).forEach(name => remove(name))
}

/**
 * Check if cookies are enabled in the browser
 * @returns {boolean} True if cookies are enabled, false otherwise
 * @example
 * // Check if cookies are enabled
 * if (cookie.isEnabled()) {
 *   console.log('Cookies are enabled');
 * } else {
 *   console.log('Cookies are disabled');
 * }
 */
function isEnabled() {
	if (typeof document === 'undefined') return false
	const test = 'test'
	set(test, test)
	const enabled = get(test) === test
	remove(test)
	return enabled
}

/**
 * Parse Set-Cookie headers and call a callback for each cookie
 * @param {string[]} setCookies - Array of Set-Cookie header strings
 * @param {function(string, string, object)} callback - Function to call for each parsed cookie
 * @example
 * // Parse Set-Cookie headers
 * const setCookies = [
 *   'session=abc123; Path=/; HttpOnly; Secure',
 *   'user=john; Expires=Wed, 21 Oct 2023 07:28:00 GMT'
 * ];
 * cookie.parse(setCookies, (name, value, options) => {
 *   console.log(name, value, options);
 * });
 */
function parse(setCookies, callback) {
	for (const header of setCookies) {
		const [cookieValue, ...optionParts] = header.split(';')
		const [name, value] = cookieValue.trim().split('=')
		const options = {}

		for (const part of optionParts) {
			const [key, val] = part.trim().split('=')
			options[key.toLowerCase()] = val || true
		}

		callback(name, value, options)
	}
}

export const cookie = { get, set, remove, getAll, removeAll, isEnabled, parse }

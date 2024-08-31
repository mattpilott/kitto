/**
 * Creates an element with a given object of attributes
 * @memberof Vanilla
 * @version 1.0.0
 * @param {string} tagName of the element such as 'div'
 * @param {object} attributes key/value object of attribute names, values, and event listeners
 * @returns {HTMLElement} returns created HTMLElement
 */
export function genElement(tagName, attributes = {}) {
	if (!tagName || typeof tagName !== 'string') {
		throw new Error('First parameter "tagName" must be a non-empty string')
	}

	const elem = document.createElement(tagName)

	for (const key in attributes) {
		if (key.startsWith('on')) {
			elem.addEventListener(key.slice(2), attributes[key])
		} else if (elem[key] === undefined) {
			elem.setAttribute(key, attributes[key])
		} else {
			elem[key] = attributes[key]
		}
	}

	return elem
}

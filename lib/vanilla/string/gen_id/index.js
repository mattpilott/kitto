/**
 * @module genID
 * @description Creates a unique id
 * @memberof Vanilla
 * @version 2.1.0
 * @param {number} idLength length of the id to create
 * @returns {string} unique id as an alphanumeric string
 */
const characters = '0123456789abcdefghijklmnopqrstuvwxyz'

export function genID(idLength = 6) {
	let id = ''

	for (let i = 0; i < idLength; i++) {
		id += characters[Math.floor(Math.random() * characters.length)]
	}

	return id
}

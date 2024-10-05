import { writable, get } from 'svelte/store'

/**
 * @module storable
 * @description Svelte store which reads/writes values to the user's localStorage.
 * @memberof Svelte
 * @version 3.0.0
 * @param {*} data - Data to create store with.
 * @param {string} [name='storable'] - Name of localStorage key.
 * @param {boolean} [session=false] - Use sessionStorage instead of localStorage.
 * @returns {object} Store methods.
 */

export function storable(data, name = 'storable', session = false) {
	if (typeof window === 'undefined') return writable(data)

	const storage = session ? sessionStorage : localStorage
	let storedData

	try {
		storedData = JSON.parse(storage.getItem(name)) ?? data
	} catch {
		storedData = data
	}

	const store = writable(storedData)
	const { subscribe, set } = store
	const initial = data

	return {
		subscribe,
		set: value => {
			storage.setItem(name, JSON.stringify(value))
			set(value)
		},
		update: fn => {
			const value = fn(get(store))
			storage.setItem(name, JSON.stringify(value))
			set(value)
		},
		reset: () => {
			storage.removeItem(name)
			set(initial)
		}
	}
}

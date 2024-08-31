import { writable, get } from 'svelte/store'

/**
 * Svelte store which reads/writes values to the user's localStorage.
 * @memberof Svelte
 * @version 2.0.0
 * @param {*} data - Data to create store with.
 * @param {string} [name='storable'] - Name of localStorage key.
 * @param {boolean} [session=false] - Use sessionStorage instead of localStorage.
 * @returns {object} Store methods.
 */

export function storable(data, name = 'storable', session) {
	const initial = JSON.stringify(data)
	const store = writable(data)
	const { subscribe, set } = store
	const storage = session ? 'sessionStorage' : 'localStorage'

	if (typeof window == 'undefined') return store

	if (window[storage][name]) {
		try {
			set(JSON.parse(window[storage][name]))
		} catch (e) {
			console.error(`Failed to parse stored value for ${name}:`, e)
		}
	}

	return {
		subscribe,
		set: data => {
			window[storage][name] = JSON.stringify(data)
			set(data)
		},
		update: callback => {
			const updatedStore = callback(get(store))

			window[storage][name] = JSON.stringify(updatedStore)
			set(updatedStore)
		},
		reset: () => {
			window[storage].removeItem(name)
			set(JSON.parse(initial))
		}
	}
}

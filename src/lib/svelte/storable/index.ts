import { writable, get, type Writable } from 'svelte/store'

/**
 * @module storable
 * @group Svelte
 * @version 4.0.0
 * @remarks Svelte store which reads/writes values to the user's localStorage or sessionStorage.
 *
 * @param data - Data to create store with.
 * @param name - Name of localStorage key.
 * @param session - Use sessionStorage instead of localStorage.
 * @returns Store methods.
 */

interface Storable<T> extends Writable<T> {
	reset: () => void
}

export function storable<T>(
	data: T,
	name: string = 'storable',
	session: boolean = false
): Storable<T> | Writable<T> {
	if (typeof window === 'undefined') return writable(data)

	const storage = session ? sessionStorage : localStorage
	let stored_data: T

	try {
		const item = storage.getItem(name)
		stored_data = item ? JSON.parse(item) : data
	} catch {
		stored_data = data
	}

	const store = writable(stored_data)
	const { subscribe, set } = store
	const initial = data

	window.addEventListener('storage', event => {
		if (event.key === name && event.storageArea === storage) {
			try {
				const new_value = JSON.parse(event.newValue ?? JSON.stringify(initial))
				set(new_value)
			} catch {
				set(initial)
			}
		}
	})

	return {
		subscribe,
		set(value) {
			storage.setItem(name, JSON.stringify(value))
			set(value)
		},
		update(fn) {
			const value = fn(get(store))
			storage.setItem(name, JSON.stringify(value))
			set(value)
		},
		reset() {
			storage.removeItem(name)
			set(initial)
		}
	}
}

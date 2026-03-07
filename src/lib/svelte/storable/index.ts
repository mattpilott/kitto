import { writable, get, type Writable } from 'svelte/store'

/**
 * @module storable
 * @group Svelte
 * @version 5.0.0
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

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

function syncSchema<T>(defaults: T, value: unknown): T {
	if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T
	if (!isPlainObject(defaults)) return (value ?? defaults) as T
	if (!isPlainObject(value)) return structuredClone(defaults)

	const merged = structuredClone(defaults) as Record<string, unknown>

	for (const [key, entry] of Object.entries(value)) {
		merged[key] = key in merged ? syncSchema(merged[key], entry) : entry
	}

	return merged as T
}

export function storable<T>(
	data: T,
	name: string = 'storable',
	session: boolean = false
): Storable<T> | Writable<T> {
	if (typeof window === 'undefined') return writable(data)

	const storage = session ? sessionStorage : localStorage
	const initial = structuredClone(data)
	const read = (item: string | null) => {
		try {
			return item ? syncSchema(initial, JSON.parse(item)) : structuredClone(initial)
		} catch {
			return structuredClone(initial)
		}
	}

	const stored_item = storage.getItem(name)
	const stored_data = read(stored_item)
	const store = writable(stored_data)
	const { subscribe, set } = store
	const persist = (value: T) => {
		const next_value = syncSchema(initial, value)
		storage.setItem(name, JSON.stringify(next_value))
		set(next_value)
	}

	if (stored_item && stored_item !== JSON.stringify(stored_data)) {
		storage.setItem(name, JSON.stringify(stored_data))
	}

	window.addEventListener('storage', event => {
		if (event.key === name && event.storageArea === storage) {
			set(read(event.newValue))
		}
	})

	return {
		subscribe,
		set: persist,
		update(fn) {
			persist(fn(get(store)))
		},
		reset() {
			storage.removeItem(name)
			set(structuredClone(initial))
		}
	}
}

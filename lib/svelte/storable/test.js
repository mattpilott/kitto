import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { storable } from './index.js'

describe('storable store', () => {
	const localStorageMock = (() => {
		let store = {}
		return {
			getItem: key => store[key] || null,
			setItem: (key, value) => (store[key] = value),
			removeItem: key => delete store[key],
			clear: () => (store = {})
		}
	})()

	const sessionStorageMock = (() => {
		let store = {}
		return {
			getItem: key => store[key] || null,
			setItem: (key, value) => (store[key] = value),
			removeItem: key => delete store[key],
			clear: () => (store = {})
		}
	})()

	beforeEach(() => {
		// Mock the window.localStorage and window.sessionStorage
		Object.defineProperty(window, 'localStorage', { value: localStorageMock })
		Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
		localStorageMock.clear()
		sessionStorageMock.clear()
	})

	afterEach(() => {
		// Cleanup any mocks or spies after each test
		vi.clearAllMocks()
	})

	it('should initialize with provided data and store it in localStorage', () => {
		const initialData = { test: 'value' }
		const store = storable(initialData, 'testStore')

		expect(JSON.parse(window.localStorage.getItem('testStore'))).toEqual(initialData)

		store.subscribe(value => {
			expect(value).toEqual(initialData)
		})
	})

	it('should initialize with data from localStorage if available', () => {
		const storedData = { test: 'storedValue' }
		window.localStorage.setItem('testStore', JSON.stringify(storedData))

		const store = storable({ test: 'defaultValue' }, 'testStore')

		store.subscribe(value => {
			expect(value).toEqual(storedData)
		})
	})

	it('should set new data and update localStorage', () => {
		const store = storable({ test: 'initialValue' }, 'testStore')
		const newData = { test: 'newValue' }

		store.set(newData)

		expect(JSON.parse(window.localStorage.getItem('testStore'))).toEqual(newData)

		store.subscribe(value => {
			expect(value).toEqual(newData)
		})
	})

	it('should update data using callback and update localStorage', () => {
		const store = storable({ count: 0 }, 'testStore')

		store.update(data => ({ count: data.count + 1 }))

		expect(JSON.parse(window.localStorage.getItem('testStore')).count).toBe(1)

		store.subscribe(value => {
			expect(value.count).toBe(1)
		})
	})

	it('should reset to initial data and remove from localStorage', () => {
		const initialData = { test: 'initialValue' }
		const store = storable(initialData, 'testStore')

		store.set({ test: 'updatedValue' })
		expect(JSON.parse(window.localStorage.getItem('testStore')).test).toBe('updatedValue')

		store.reset()

		expect(window.localStorage.getItem('testStore')).toBeNull()

		store.subscribe(value => {
			expect(value).toEqual(initialData)
		})
	})

	it('should use sessionStorage when specified', () => {
		const initialData = { test: 'value' }
		const store = storable(initialData, 'testStore', true)

		expect(JSON.parse(window.sessionStorage.getItem('testStore'))).toEqual(initialData)

		store.subscribe(value => {
			expect(value).toEqual(initialData)
		})
	})
})

import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
})

// jsdom implements neither ResizeObserver nor pointer capture, both of which the slider uses
Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
})

Element.prototype.setPointerCapture ??= function () {}
Element.prototype.releasePointerCapture ??= function () {}

// add more mocks here if you need them

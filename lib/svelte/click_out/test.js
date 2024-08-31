import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import { clickOut } from './index.js'

describe('clickOut action', () => {
	let node
	let excludeElement
	let callback

	beforeEach(() => {
		// Create a mock DOM structure
		node = document.createElement('div')
		document.body.appendChild(node)

		excludeElement = document.createElement('div')
		document.body.appendChild(excludeElement)

		callback = vi.fn() // Create a mock callback
	})

	afterEach(() => {
		document.body.removeChild(node)
		document.body.removeChild(excludeElement)
		callback.mockClear() // Clear the mock callback
	})

	it('should call the callback when clicking outside the node', () => {
		// Apply the action
		const action = clickOut(node, [callback])

		// Simulate a click outside the node
		document.body.click()

		expect(callback).toHaveBeenCalledTimes(1)

		// Cleanup
		action.destroy()
	})

	it('should not call the callback when clicking inside the node', () => {
		// Apply the action
		const action = clickOut(node, [callback])

		// Simulate a click inside the node
		node.click()

		expect(callback).not.toHaveBeenCalled()

		// Cleanup
		action.destroy()
	})

	it('should not call the callback when clicking on the exclude element', () => {
		// Apply the action
		const action = clickOut(node, [callback, excludeElement])

		// Simulate a click on the exclude element
		excludeElement.click()

		expect(callback).not.toHaveBeenCalled()

		// Cleanup
		action.destroy()
	})

	it('should clean up event listeners on destroy', () => {
		// Spy on the removeEventListener method
		const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

		// Apply the action
		const action = clickOut(node, [callback])

		// Destroy the action
		action.destroy()

		expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

		// Cleanup spy
		removeEventListenerSpy.mockRestore()
	})
})

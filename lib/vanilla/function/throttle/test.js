import { describe, it, expect, vi } from 'vitest'
import { throttle } from './index.js' // Adjust the path as necessary

describe('throttle', () => {
	it('should call the function immediately on the first call', () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it('should not call the function again if called within the delay', () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn()
		throttledFn()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it('should call the function again after the delay has passed', async () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn()
		await new Promise(resolve => setTimeout(resolve, 550)) // Wait for more than the delay
		throttledFn()
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it('should pass arguments to the throttled function', () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn('arg1', 'arg2')
		expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
	})

	it('should maintain the correct `this` context', () => {
		const context = { value: 42 }
		const fn = function () {
			expect(this.value).toBe(42)
		}
		const throttledFn = throttle(fn.bind(context), 500)

		throttledFn()
	})

	it('should throttle multiple calls within the delay period', async () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn()
		await new Promise(resolve => setTimeout(resolve, 10)) // Short delay
		throttledFn()
		await new Promise(resolve => setTimeout(resolve, 10)) // Short delay
		throttledFn()

		expect(fn).toHaveBeenCalledTimes(1)

		// Wait for slightly more than the throttle delay
		await new Promise(resolve => setTimeout(resolve, 505))

		throttledFn()
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it('should reset the timer after the delay period', async () => {
		const fn = vi.fn()
		const throttledFn = throttle(fn, 500)

		throttledFn()
		await new Promise(resolve => setTimeout(resolve, 500))
		throttledFn()
		await new Promise(resolve => setTimeout(resolve, 500))
		throttledFn()

		expect(fn).toHaveBeenCalledTimes(3)
	})
})

/* Imports */
import { describe, it, expect } from 'vitest'
import { latch, type Jar } from './index.js'

/* Setup */
const YEAR = 60 * 60 * 24 * 365

/** Minimal in-memory jar that records every write. */
function gen_jar(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial))
	const writes: Array<{ name: string; value?: string; options: Record<string, unknown> }> = []

	const jar: Jar = {
		get: name => store.get(name),
		set: (name, value, options) => {
			store.set(name, value)
			writes.push({ name, value, options })
		},
		delete: (name, options) => {
			store.delete(name)
			writes.push({ name, options })
		}
	}

	return { jar, store, writes }
}

const gen_url = (search = '') => new URL(`https://example.com/${search}`)

/* Test */
describe('latch', () => {
	describe('toggle spec', () => {
		it('should latch on when a bare param is present', () => {
			const { jar, store } = gen_jar()
			const { android } = latch(jar, gen_url('?android'), {
				android: { on: 'android', off: 'ios' }
			})

			expect(android).toBe(true)
			expect(store.get('android')).toBe('true')
		})

		it('should release when the counter-signal fires', () => {
			const { jar, store } = gen_jar({ android: 'true' })
			const { android } = latch(jar, gen_url('?ios'), { android: { on: 'android', off: 'ios' } })

			expect(android).toBe(false)
			expect(store.has('android')).toBe(false)
		})

		it('should hold the stored value when neither signal fires', () => {
			const { jar, writes } = gen_jar({ android: 'true' })
			const { android } = latch(jar, gen_url('?unrelated=1'), {
				android: { on: 'android', off: 'ios' }
			})

			expect(android).toBe(true)
			expect(writes).toHaveLength(0)
		})

		it('should stay off when nothing is stored and nothing fires', () => {
			const { jar, writes } = gen_jar()
			const { android } = latch(jar, gen_url(), { android: { on: 'android', off: 'ios' } })

			expect(android).toBe(false)
			expect(writes).toHaveLength(0)
		})

		it('should match a signal by value', () => {
			const { jar } = gen_jar()
			const { stage } = latch(jar, gen_url('?st=1'), { stage: { on: 'st=1', off: 'st=0' } })

			expect(stage).toBe(true)
		})

		it('should not treat a valueless param as a value signal', () => {
			const { jar, writes } = gen_jar()
			const { stage } = latch(jar, gen_url('?st'), { stage: { on: 'st=1', off: 'st=0' } })

			expect(stage).toBe(false)
			expect(writes).toHaveLength(0)
		})

		it('should not treat a missing param as the off signal', () => {
			const { jar } = gen_jar({ stage: 'true' })
			const { stage } = latch(jar, gen_url(), { stage: { on: 'st=1', off: 'st=0' } })

			expect(stage).toBe(true)
		})

		it('should let off win when both signals fire', () => {
			const { jar, store } = gen_jar()
			const { android } = latch(jar, gen_url('?android&ios'), {
				android: { on: 'android', off: 'ios' }
			})

			expect(android).toBe(false)
			expect(store.has('android')).toBe(false)
		})

		it('should not rewrite a cookie that is already set', () => {
			const { jar, writes } = gen_jar({ android: 'true' })
			latch(jar, gen_url('?android'), { android: { on: 'android', off: 'ios' } })

			expect(writes).toHaveLength(0)
		})
	})

	describe('value spec', () => {
		it('should persist and return a valid param', () => {
			const { jar, store } = gen_jar()
			const { appearance } = latch(jar, gen_url('?appearance=dark'), {
				appearance: ['system', 'light', 'dark']
			})

			expect(appearance).toBe('dark')
			expect(store.get('appearance')).toBe('dark')
		})

		it('should ignore an invalid param and keep the stored value', () => {
			const { jar, writes } = gen_jar({ appearance: 'dark' })
			const { appearance } = latch(jar, gen_url('?appearance=neon'), {
				appearance: ['system', 'light', 'dark']
			})

			expect(appearance).toBe('dark')
			expect(writes).toHaveLength(0)
		})

		it('should fall back to the first value when unset', () => {
			const { jar, writes } = gen_jar()
			const { appearance } = latch(jar, gen_url(), { appearance: ['system', 'light', 'dark'] })

			expect(appearance).toBe('system')
			expect(writes).toHaveLength(0)
		})

		it('should fall back to the first value when the stored value is invalid', () => {
			const { jar } = gen_jar({ appearance: 'neon' })
			const { appearance } = latch(jar, gen_url(), { appearance: ['system', 'light', 'dark'] })

			expect(appearance).toBe('system')
		})

		it('should not rewrite when the param matches the stored value', () => {
			const { jar, writes } = gen_jar({ appearance: 'dark' })
			latch(jar, gen_url('?appearance=dark'), { appearance: ['system', 'light', 'dark'] })

			expect(writes).toHaveLength(0)
		})
	})

	describe('options', () => {
		it('should write with a year maxAge at the root path by default', () => {
			const { jar, writes } = gen_jar()
			latch(jar, gen_url('?android'), { android: { on: 'android', off: 'ios' } })

			expect(writes[0].options).toStrictEqual({ path: '/', maxAge: YEAR })
		})

		it('should apply custom cookie options to writes and deletes', () => {
			const { jar, writes } = gen_jar({ android: 'true' })
			latch(jar, gen_url('?ios'), { android: { on: 'android', off: 'ios' } }, { path: '/app', maxAge: 60 })

			expect(writes[0].options).toStrictEqual({ path: '/app' })
		})
	})

	it('should resolve every key in one pass', () => {
		const { jar } = gen_jar({ android: 'true' })
		const result = latch(jar, gen_url('?st=1&appearance=light'), {
			android: { on: 'android', off: 'ios' },
			stage: { on: 'st=1', off: 'st=0' },
			appearance: ['system', 'light', 'dark']
		})

		expect(result).toStrictEqual({ android: true, stage: true, appearance: 'light' })
	})
})

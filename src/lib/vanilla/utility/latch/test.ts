/* Imports */
import { describe, it, expect } from 'vitest'
import { latch, type Jar } from './index.js'

/* Setup */
const YEAR = 60 * 60 * 24 * 365
const SECURE = { path: '/', maxAge: YEAR, httpOnly: true, secure: true }

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

const gen_options = (initial?: Record<string, string>, search?: string) => {
	const { jar, store, writes } = gen_jar(initial)

	return { jar, store, writes, options: { jar, url: gen_url(search) } }
}

/* Test */
describe('latch', () => {
	describe('toggle spec', () => {
		it('should latch on when a bare param is present', () => {
			const { store, options } = gen_options({}, '?android')
			const { android } = latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(android).toBe(true)
			expect(store.get('android')).toBe('true')
		})

		it('should release when the counter-signal fires', () => {
			const { store, options } = gen_options({ android: 'true' }, '?ios')
			const { android } = latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(android).toBe(false)
			expect(store.has('android')).toBe(false)
		})

		it('should hold the stored value when neither signal fires', () => {
			const { writes, options } = gen_options({ android: 'true' }, '?unrelated=1')
			const { android } = latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(android).toBe(true)
			expect(writes).toHaveLength(0)
		})

		it('should stay off when nothing is stored and nothing fires', () => {
			const { writes, options } = gen_options()
			const { android } = latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(android).toBe(false)
			expect(writes).toHaveLength(0)
		})

		it('should match a signal by value', () => {
			const { options } = gen_options({}, '?st=1')
			const { stage } = latch({ stage: { on: 'st=1', off: 'st=0' } }, options)

			expect(stage).toBe(true)
		})

		it('should not treat a valueless param as a value signal', () => {
			const { writes, options } = gen_options({}, '?st')
			const { stage } = latch({ stage: { on: 'st=1', off: 'st=0' } }, options)

			expect(stage).toBe(false)
			expect(writes).toHaveLength(0)
		})

		it('should not treat a missing param as the off signal', () => {
			const { options } = gen_options({ stage: 'true' })
			const { stage } = latch({ stage: { on: 'st=1', off: 'st=0' } }, options)

			expect(stage).toBe(true)
		})

		it('should let off win when both signals fire', () => {
			const { store, options } = gen_options({}, '?android&ios')
			const { android } = latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(android).toBe(false)
			expect(store.has('android')).toBe(false)
		})

		it('should not rewrite a cookie that is already set', () => {
			const { writes, options } = gen_options({ android: 'true' }, '?android')
			latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(writes).toHaveLength(0)
		})
	})

	describe('allow-list spec', () => {
		it('should persist and return a valid param', () => {
			const { store, options } = gen_options({}, '?appearance=dark')
			const { appearance } = latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(appearance).toBe('dark')
			expect(store.get('appearance')).toBe('dark')
		})

		it('should ignore an invalid param and keep the stored value', () => {
			const { writes, options } = gen_options({ appearance: 'dark' }, '?appearance=neon')
			const { appearance } = latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(appearance).toBe('dark')
			expect(writes).toHaveLength(0)
		})

		it('should fall back to the first value when unset', () => {
			const { writes, options } = gen_options()
			const { appearance } = latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(appearance).toBe('system')
			expect(writes).toHaveLength(0)
		})

		it('should fall back to the first value when the stored value is invalid', () => {
			const { options } = gen_options({ appearance: 'neon' })
			const { appearance } = latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(appearance).toBe('system')
		})

		it('should not rewrite when the param matches the stored value', () => {
			const { writes, options } = gen_options({ appearance: 'dark' }, '?appearance=dark')
			latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(writes).toHaveLength(0)
		})
	})

	describe('open spec', () => {
		it('should store any value the param carries', () => {
			const { store, options } = gen_options({}, '?ref=newsletter')
			const { ref } = latch({ ref: true }, options)

			expect(ref).toBe('newsletter')
			expect(store.get('ref')).toBe('newsletter')
		})

		it('should return undefined when nothing is stored', () => {
			const { writes, options } = gen_options()
			const { ref } = latch({ ref: true }, options)

			expect(ref).toBeUndefined()
			expect(writes).toHaveLength(0)
		})

		it('should return the stored value when the param is absent', () => {
			const { options } = gen_options({ ref: 'newsletter' })
			const { ref } = latch({ ref: true }, options)

			expect(ref).toBe('newsletter')
		})

		it('should update a stored value', () => {
			const { store, options } = gen_options({ ref: 'newsletter' }, '?ref=podcast')
			const { ref } = latch({ ref: true }, options)

			expect(ref).toBe('podcast')
			expect(store.get('ref')).toBe('podcast')
		})
	})

	describe('removal', () => {
		it('should clear an open value on a valueless param', () => {
			const { store, options } = gen_options({ ref: 'newsletter' }, '?ref=')
			const { ref } = latch({ ref: true }, options)

			expect(ref).toBeUndefined()
			expect(store.has('ref')).toBe(false)
		})

		it('should clear an allow-listed value and fall back', () => {
			const { store, options } = gen_options({ appearance: 'dark' }, '?appearance=')
			const { appearance } = latch({ appearance: ['system', 'light', 'dark'] }, options)

			expect(appearance).toBe('system')
			expect(store.has('appearance')).toBe(false)
		})

		it('should not write when there is nothing to clear', () => {
			const { writes, options } = gen_options({}, '?ref=')
			latch({ ref: true }, options)

			expect(writes).toHaveLength(0)
		})
	})

	describe('cookie attributes', () => {
		it('should write httpOnly and secure with a year maxAge at the root by default', () => {
			const { writes, options } = gen_options({}, '?android')
			latch({ android: { on: 'android', off: 'ios' } }, options)

			expect(writes[0].options).toStrictEqual(SECURE)
		})

		it('should allow httpOnly and secure to be switched off', () => {
			const { writes, options } = gen_options({}, '?appearance=dark')
			latch({ appearance: ['system', 'light', 'dark'] }, { ...options, httpOnly: false, secure: false })

			expect(writes[0].options).toStrictEqual({ ...SECURE, httpOnly: false, secure: false })
		})

		it('should apply a custom path and maxAge, and delete on the same path', () => {
			const { writes, options } = gen_options({ android: 'true' }, '?ios')
			latch({ android: { on: 'android', off: 'ios' } }, { ...options, path: '/app', maxAge: 60 })

			expect(writes[0].options).toStrictEqual({ path: '/app' })
		})
	})

	describe('inference', () => {
		const in_browser = typeof document !== 'undefined'

		it.runIf(in_browser)('should read location and write document.cookie', () => {
			history.replaceState({}, '', '?ref=podcast')

			// `secure` off so jsdom keeps the cookie on an http origin
			const { ref } = latch({ ref: true }, { secure: false })

			expect(ref).toBe('podcast')
			expect(document.cookie).toContain('ref=podcast')
		})

		it.runIf(in_browser)('should clear an inferred cookie on a valueless param', () => {
			document.cookie = 'ref=newsletter; Path=/'
			history.replaceState({}, '', '?ref=')

			const { ref } = latch({ ref: true }, { secure: false })

			expect(ref).toBeUndefined()
			expect(document.cookie).not.toContain('ref=newsletter')
		})

		it.runIf(!in_browser)('should throw when no jar is given and there is no document', () => {
			expect(() => latch({ ref: true }, { url: gen_url() })).toThrow(/no `jar` given/)
		})

		it.runIf(typeof location === 'undefined')(
			'should throw when no url is given and there is no location',
			() => {
				const { jar } = gen_jar()

				expect(() => latch({ ref: true }, { jar })).toThrow(/no `url` given/)
			}
		)
	})

	it('should resolve every spec in one pass', () => {
		const { options } = gen_options({ android: 'true' }, '?st=1&appearance=light&ref=podcast')
		const result = latch(
			{
				android: { on: 'android', off: 'ios' },
				stage: { on: 'st=1', off: 'st=0' },
				appearance: ['system', 'light', 'dark'],
				ref: true
			},
			options
		)

		expect(result).toStrictEqual({
			android: true,
			stage: true,
			appearance: 'light',
			ref: 'podcast'
		})
	})
})

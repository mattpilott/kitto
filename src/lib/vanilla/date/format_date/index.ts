type FormatFn = (d: Date, utc?: boolean) => string

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
] as const
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const suffs = ['th', 'st', 'nd', 'rd'] as const

const pad = (s: number, len = 2) => s.toString().padStart(len, '0')
const ordinal = (n: number) => n + (suffs[((n % 100) - 20) % 10] || suffs[n % 100] || suffs[0])

const format_cache = new Map()

const formats: Record<string, FormatFn> = {
	YY: (d, utc) => String(utc ? d.getUTCFullYear() : d.getFullYear()).slice(-2),
	YYYY: (d, utc) => String(utc ? d.getUTCFullYear() : d.getFullYear()),

	M: (d, utc) => String((utc ? d.getUTCMonth() : d.getMonth()) + 1),
	MM: (d, utc) => pad((utc ? d.getUTCMonth() : d.getMonth()) + 1),
	MMM: (d, utc) => months[utc ? d.getUTCMonth() : d.getMonth()].slice(0, 3),
	MMMM: (d, utc) => months[utc ? d.getUTCMonth() : d.getMonth()],

	D: (d, utc) => String(utc ? d.getUTCDate() : d.getDate()),
	DD: (d, utc) => pad(utc ? d.getUTCDate() : d.getDate()),
	d: (d, utc) => String(utc ? d.getUTCDay() : d.getDay()),
	dd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()].slice(0, 1),
	ddd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()].slice(0, 3),
	dddd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()],
	Do: (d, utc) => ordinal(utc ? d.getUTCDate() : d.getDate()),

	H: (d, utc) => String(utc ? d.getUTCHours() : d.getHours()),
	HH: (d, utc) => pad(utc ? d.getUTCHours() : d.getHours()),
	h: (d, utc) => String((utc ? d.getUTCHours() : d.getHours()) % 12 || 12),
	hh: (d, utc) => pad((utc ? d.getUTCHours() : d.getHours()) % 12 || 12),

	m: (d, utc) => String(utc ? d.getUTCMinutes() : d.getMinutes()),
	mm: (d, utc) => pad(utc ? d.getUTCMinutes() : d.getMinutes()),

	s: (d, utc) => String(utc ? d.getUTCSeconds() : d.getSeconds()),
	ss: (d, utc) => pad(utc ? d.getUTCSeconds() : d.getSeconds()),

	SSS: (d, utc) => pad(utc ? d.getUTCMilliseconds() : d.getMilliseconds(), 3),

	A: (d, utc) => ((utc ? d.getUTCHours() : d.getHours()) >= 12 ? 'PM' : 'AM'),
	a: (d, utc) => ((utc ? d.getUTCHours() : d.getHours()) >= 12 ? 'pm' : 'am')
}

const format_regex = /{([^{}]+)}/g

/**
 * @module format_date
 * @remarks Creates a nice formatted date from a unix timestamp
 * @group Vanilla
 * @version 3.1.0
 * @param str - String containing formats ie. {YYYY}
 * @param date - Date object, timestamp, or date string
 * @param options - Options for date formatting
 * @param options.utc - Use UTC time instead of local time
 * @returns Formatted date string
 */
export function format_date(
	str: string,
	date: Date | string | number = new Date(),
	options: { utc?: boolean } = {}
) {
	const d = date instanceof Date ? date : new Date(date)
	const utc = options.utc || false

	let format_fn = format_cache.get(str + (utc ? '-utc' : '')) as FormatFn

	if (!format_fn) {
		const parts: Array<string | FormatFn> = []
		let last_index = 0

		str.replace(format_regex, (match, f, index) => {
			if (index > last_index) {
				parts.push(str.slice(last_index, index))
			}

			if (!formats[f as keyof typeof formats]) {
				throw new Error(`{${f}} is an invalid format. Valid formats are: ${Object.keys(formats).join(', ')}`)
			}

			parts.push(formats[f as keyof typeof formats])

			last_index = index + match.length

			return ''
		})

		if (last_index < str.length) {
			parts.push(str.slice(last_index))
		}

		format_fn = date => parts.map(part => (typeof part === 'function' ? part(date, utc) : part)).join('')

		format_cache.set(str + (utc ? '-utc' : ''), format_fn)
	}

	return format_fn(d)
}

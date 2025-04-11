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
]
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const suffs = ['th', 'st', 'nd', 'rd']

const pad = (s, len = 2) => s.toString().padStart(len, '0')
const ordinal = n => n + (suffs[((n % 100) - 20) % 10] || suffs[n % 100] || suffs[0])

const formatCache = new Map()

const formats = {
	/* eslint-disable id-match */
	YY: (d, utc) => String(utc ? d.getUTCFullYear() : d.getFullYear()).slice(-2),
	YYYY: (d, utc) => (utc ? d.getUTCFullYear() : d.getFullYear()),

	M: (d, utc) => (utc ? d.getUTCMonth() : d.getMonth()) + 1,
	MM: (d, utc) => pad((utc ? d.getUTCMonth() : d.getMonth()) + 1),
	MMM: (d, utc) => months[utc ? d.getUTCMonth() : d.getMonth()].slice(0, 3),
	MMMM: (d, utc) => months[utc ? d.getUTCMonth() : d.getMonth()],

	D: (d, utc) => (utc ? d.getUTCDate() : d.getDate()),
	DD: (d, utc) => pad(utc ? d.getUTCDate() : d.getDate()),
	d: (d, utc) => (utc ? d.getUTCDay() : d.getDay()),
	dd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()].slice(0, 1),
	ddd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()].slice(0, 3),
	dddd: (d, utc) => days[utc ? d.getUTCDay() : d.getDay()],
	Do: (d, utc) => ordinal(utc ? d.getUTCDate() : d.getDate()),

	H: (d, utc) => (utc ? d.getUTCHours() : d.getHours()),
	HH: (d, utc) => pad(utc ? d.getUTCHours() : d.getHours()),
	h: (d, utc) => (utc ? d.getUTCHours() : d.getHours()) % 12 || 12,
	hh: (d, utc) => pad((utc ? d.getUTCHours() : d.getHours()) % 12 || 12),

	m: (d, utc) => (utc ? d.getUTCMinutes() : d.getMinutes()),
	mm: (d, utc) => pad(utc ? d.getUTCMinutes() : d.getMinutes()),

	s: (d, utc) => (utc ? d.getUTCSeconds() : d.getSeconds()),
	ss: (d, utc) => pad(utc ? d.getUTCSeconds() : d.getSeconds()),

	SSS: (d, utc) => pad(utc ? d.getUTCMilliseconds() : d.getMilliseconds(), 3),

	A: (d, utc) => ((utc ? d.getUTCHours() : d.getHours()) >= 12 ? 'PM' : 'AM'),
	a: (d, utc) => ((utc ? d.getUTCHours() : d.getHours()) >= 12 ? 'pm' : 'am')
	/* eslint-enable id-match */
}

const formatRegex = /{([^{}]+)}/g

/**
 * @module formatDate
 * @description Creates a nice formatted date from a unix timestamp
 * @memberof Vanilla
 * @version 3.1.0
 * @param {string} str - string containing formats ie. {YYYY}
 * @param {Date|number|string} [date] - Date object, timestamp, or date string
 * @param {Object} [options] - Options for date formatting
 * @param {boolean} [options.utc=false] - Use UTC time instead of local time
 * @returns {string} Formatted date string
 */
export function formatDate(str, date = new Date(), options = {}) {
	const d = date instanceof Date ? date : new Date(date)
	const utc = options.utc || false

	let formatFunc = formatCache.get(str + (utc ? '-utc' : ''))

	if (!formatFunc) {
		const parts = []
		let lastIndex = 0

		str.replace(formatRegex, (match, f, index) => {
			if (index > lastIndex) {
				parts.push(str.slice(lastIndex, index))
			}

			if (!formats[f]) {
				throw new Error(`{${f}} is an invalid format. Valid formats are: ${Object.keys(formats).join(', ')}`)
			}

			parts.push(formats[f])

			lastIndex = index + match.length
		})

		if (lastIndex < str.length) {
			parts.push(str.slice(lastIndex))
		}

		formatFunc = date => parts.map(part => (typeof part === 'function' ? part(date, utc) : part)).join('')

		formatCache.set(str + (utc ? '-utc' : ''), formatFunc)
	}

	return formatFunc(d)
}

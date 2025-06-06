/**
 * @module query
 * @remarks Converts an object to a url query string or vice-versa
 *
 * @param data - The object to encode or string to decode
 * @param pfx - The prefix for the encoded string
 * @returns The encoded string or decoded object
 */

function encode(obj: Record<string, unknown> | string, pfx?: string) {
	// eslint-disable-next-line no-var
	var k,
		i,
		tmp,
		str = ''

	// @ts-expect-error - @todo fix this
	for (k in obj) {
		// @ts-expect-error - @todo fix this
		if ((tmp = obj[k]) !== void 0) {
			if (Array.isArray(tmp)) {
				for (i = 0; i < tmp.length; i++) {
					if (str) str += '&'
					str += encodeURIComponent(k) + '=' + encodeURIComponent(tmp[i])
				}
			} else {
				if (str) str += '&'
				str += encodeURIComponent(k) + '=' + encodeURIComponent(tmp)
			}
		}
	}

	return (pfx || '') + str
}

function to_value(mix: string) {
	if (!mix) return ''
	// eslint-disable-next-line no-var
	var str = decodeURIComponent(mix)
	if (str === 'false') return false
	if (str === 'true') return true
	return +str * 0 === 0 ? +str : str
}

function decode(str: string) {
	// eslint-disable-next-line no-var
	var tmp,
		k,
		out: Record<string, unknown> = {},
		nstr = str.includes('?') ? str.split('?')[1] : str,
		arr = nstr.split('&')

	while ((tmp = arr.shift())) {
		tmp = tmp.split('=')
		k = tmp.shift() as keyof typeof out
		if (out[k] !== void 0) {
			// @ts-expect-error - @todo fix this
			out[k] = [].concat(out[k], to_value(tmp.shift()))
		} else {
			// @ts-expect-error - @todo fix this
			out[k] = to_value(tmp.shift())
		}
	}

	return out
}

export function query(data: Record<string, unknown> | string, pfx?: string) {
	return data.constructor === Object ? encode(data, pfx) : decode(data as string)
}

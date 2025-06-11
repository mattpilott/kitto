// ../node_modules/svelte/src/runtime/internal/utils.js
function noop() {}
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function'
}
function subscribe(store, ...callbacks) {
	if (store == null) {
		for (const callback of callbacks) {
			callback(undefined)
		}
		return noop
	}
	const unsub = store.subscribe(...callbacks)
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub
}
function get_store_value(store) {
	let value
	subscribe(store, _ => (value = _))()
	return value
}

// ../node_modules/svelte/src/runtime/internal/loop.js
var tasks = new Set()

// ../node_modules/svelte/src/runtime/internal/globals.js
var globals = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : global

// ../node_modules/svelte/src/runtime/internal/ResizeObserverSingleton.js
class ResizeObserverSingleton {
	_listeners = 'WeakMap' in globals ? new WeakMap() : undefined
	_observer = undefined
	options
	constructor(options) {
		this.options = options
	}
	observe(element, listener) {
		this._listeners.set(element, listener)
		this._getObserver().observe(element, this.options)
		return () => {
			this._listeners.delete(element)
			this._observer.unobserve(element)
		}
	}
	_getObserver() {
		return (
			this._observer ??
			(this._observer = new ResizeObserver(entries => {
				for (const entry of entries) {
					ResizeObserverSingleton.entries.set(entry.target, entry)
					this._listeners.get(entry.target)?.(entry)
				}
			}))
		)
	}
}
ResizeObserverSingleton.entries = 'WeakMap' in globals ? new WeakMap() : undefined

// ../node_modules/svelte/src/runtime/internal/dom.js
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null)
}
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node)
	}
}
function element(name) {
	return document.createElement(name)
}
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute)
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value)
}
function get_custom_elements_slots(element2) {
	const result = {}
	element2.childNodes.forEach(node => {
		result[node.slot || 'default'] = true
	})
	return result
}

// ../node_modules/svelte/src/runtime/internal/style_manager.js
var managed_styles = new Map()
// ../node_modules/svelte/src/runtime/internal/scheduler.js
var seen_callbacks = new Set()

// ../node_modules/svelte/src/runtime/internal/transitions.js
var outroing = new Set()
// ../node_modules/svelte/src/shared/boolean_attributes.js
var _boolean_attributes = [
	'allowfullscreen',
	'allowpaymentrequest',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'inert',
	'ismap',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected'
]
var boolean_attributes = new Set([..._boolean_attributes])
// ../node_modules/svelte/src/runtime/internal/Component.js
function get_custom_element_value(prop, value, props_definition, transform) {
	const type = props_definition[prop]?.type
	value = type === 'Boolean' && typeof value !== 'boolean' ? value != null : value
	if (!transform || !props_definition[prop]) {
		return value
	} else if (transform === 'toAttribute') {
		switch (type) {
			case 'Object':
			case 'Array':
				return value == null ? null : JSON.stringify(value)
			case 'Boolean':
				return value ? '' : null
			case 'Number':
				return value == null ? null : value
			default:
				return value
		}
	} else {
		switch (type) {
			case 'Object':
			case 'Array':
				return value && JSON.parse(value)
			case 'Boolean':
				return value
			case 'Number':
				return value != null ? +value : value
			default:
				return value
		}
	}
}
var SvelteElement
if (typeof HTMLElement === 'function') {
	SvelteElement = class extends HTMLElement {
		$$ctor
		$$s
		$$c
		$$cn = false
		$$d = {}
		$$r = false
		$$p_d = {}
		$$l = {}
		$$l_u = new Map()
		constructor($$componentCtor, $$slots, use_shadow_dom) {
			super()
			this.$$ctor = $$componentCtor
			this.$$s = $$slots
			if (use_shadow_dom) {
				this.attachShadow({ mode: 'open' })
			}
		}
		addEventListener(type, listener, options) {
			this.$$l[type] = this.$$l[type] || []
			this.$$l[type].push(listener)
			if (this.$$c) {
				const unsub = this.$$c.$on(type, listener)
				this.$$l_u.set(listener, unsub)
			}
			super.addEventListener(type, listener, options)
		}
		removeEventListener(type, listener, options) {
			super.removeEventListener(type, listener, options)
			if (this.$$c) {
				const unsub = this.$$l_u.get(listener)
				if (unsub) {
					unsub()
					this.$$l_u.delete(listener)
				}
			}
		}
		async connectedCallback() {
			this.$$cn = true
			if (!this.$$c) {
				let create_slot = function (name) {
					return () => {
						let node
						const obj = {
							c: function create() {
								node = element('slot')
								if (name !== 'default') {
									attr(node, 'name', name)
								}
							},
							m: function mount(target, anchor) {
								insert(target, node, anchor)
							},
							d: function destroy(detaching) {
								if (detaching) {
									detach(node)
								}
							}
						}
						return obj
					}
				}
				await Promise.resolve()
				if (!this.$$cn || this.$$c) {
					return
				}
				const $$slots = {}
				const existing_slots = get_custom_elements_slots(this)
				for (const name of this.$$s) {
					if (name in existing_slots) {
						$$slots[name] = [create_slot(name)]
					}
				}
				for (const attribute of this.attributes) {
					const name = this.$$g_p(attribute.name)
					if (!(name in this.$$d)) {
						this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, 'toProp')
					}
				}
				for (const key in this.$$p_d) {
					if (!(key in this.$$d) && this[key] !== undefined) {
						this.$$d[key] = this[key]
						delete this[key]
					}
				}
				this.$$c = new this.$$ctor({
					target: this.shadowRoot || this,
					props: {
						...this.$$d,
						$$slots,
						$$scope: {
							ctx: []
						}
					}
				})
				const reflect_attributes = () => {
					this.$$r = true
					for (const key in this.$$p_d) {
						this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]]
						if (this.$$p_d[key].reflect) {
							const attribute_value = get_custom_element_value(
								key,
								this.$$d[key],
								this.$$p_d,
								'toAttribute'
							)
							if (attribute_value == null) {
								this.removeAttribute(this.$$p_d[key].attribute || key)
							} else {
								this.setAttribute(this.$$p_d[key].attribute || key, attribute_value)
							}
						}
					}
					this.$$r = false
				}
				this.$$c.$$.after_update.push(reflect_attributes)
				reflect_attributes()
				for (const type in this.$$l) {
					for (const listener of this.$$l[type]) {
						const unsub = this.$$c.$on(type, listener)
						this.$$l_u.set(listener, unsub)
					}
				}
				this.$$l = {}
			}
		}
		attributeChangedCallback(attr2, _oldValue, newValue) {
			if (this.$$r) return
			attr2 = this.$$g_p(attr2)
			this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, 'toProp')
			this.$$c?.$set({ [attr2]: this.$$d[attr2] })
		}
		disconnectedCallback() {
			this.$$cn = false
			Promise.resolve().then(() => {
				if (!this.$$cn && this.$$c) {
					this.$$c.$destroy()
					this.$$c = undefined
				}
			})
		}
		$$g_p(attribute_name) {
			return (
				Object.keys(this.$$p_d).find(
					key =>
						this.$$p_d[key].attribute === attribute_name ||
						(!this.$$p_d[key].attribute && key.toLowerCase() === attribute_name)
				) || attribute_name
			)
		}
	}
}
// ../node_modules/svelte/src/runtime/store/index.js
function writable(value, start = noop) {
	let stop
	const subscribers = new Set()
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value
			if (stop) {
				const run_queue = !subscriber_queue.length
				for (const subscriber of subscribers) {
					subscriber[1]()
					subscriber_queue.push(subscriber, value)
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1])
					}
					subscriber_queue.length = 0
				}
			}
		}
	}
	function update(fn) {
		set(fn(value))
	}
	function subscribe2(run2, invalidate = noop) {
		const subscriber = [run2, invalidate]
		subscribers.add(subscriber)
		if (subscribers.size === 1) {
			stop = start(set, update) || noop
		}
		run2(value)
		return () => {
			subscribers.delete(subscriber)
			if (subscribers.size === 0 && stop) {
				stop()
				stop = null
			}
		}
	}
	return { set, update, subscribe: subscribe2 }
}
var subscriber_queue = []

// ../lib/svelte/storable/index.js
function storable(data, name = 'storable', session) {
	const initial = JSON.stringify(data)
	const store2 = writable(data)
	const { subscribe: subscribe2, set, update } = store2
	const storage = session ? 'sessionStorage' : 'localStorage'
	if (typeof window == 'undefined') return store2
	if (window[storage][name]) {
		try {
			set(JSON.parse(window[storage][name]))
		} catch (e) {
			console.error(`Failed to parse stored value for ${name}:`, e)
		}
	}
	return {
		subscribe: subscribe2,
		set: data2 => {
			window[storage][name] = JSON.stringify(data2)
			set(data2)
		},
		update: callback => {
			const updatedStore = callback(get_store_value(store2))
			window[storage][name] = JSON.stringify(updatedStore)
			set(updatedStore)
		},
		reset: () => {
			window[storage].removeItem(name)
			set(JSON.parse(initial))
		}
	}
}
// ../lib/vanilla/array/find_index/index.js
function find_index(arr, key, value, recursive = false, returnParent = false) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]
		if (obj[key] === value) {
			return i
		}
		if (recursive) {
			for (const k in obj) {
				const nested = obj[k]
				if (Array.isArray(nested)) {
					const resultIndex = find_index(nested, key, value, recursive, returnParent)
					if (resultIndex !== -1) {
						return returnParent ? i : resultIndex
					}
				} else if (typeof nested === 'object' && nested !== null) {
					const resultIndex = find_index([nested], key, value, recursive, returnParent)
					if (resultIndex !== -1) {
						return returnParent ? i : resultIndex
					}
				}
			}
		}
	}
	return -1
}
// index.js
console.log(find_index, storable)

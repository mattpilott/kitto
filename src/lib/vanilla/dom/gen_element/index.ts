/**
 * @module gen_element
 * @group Vanilla
 * @version 1.0.0
 * @remarks
 * Creates an element with a given object of attributes
 *
 * @param tag_name - The tag name of the element such as 'div'
 * @param attributes - The attributes of the element
 * @returns The created HTMLElement
 * @example
 * ```ts
 * import { gen_element } from 'kitto'
 *
 * const element = gen_element('div', {
 *   class: 'container',
 *   onclick: () => console.log('clicked')
 * })
 *
 * document.body.appendChild(element)
 * ```
 */
export function gen_element(tag_name: string, attributes: Record<string, unknown> = {}): HTMLElement {
	const elem = document.createElement(tag_name)

	for (const key in attributes) {
		if (key.startsWith('on')) {
			elem.addEventListener(key.slice(2), attributes[key] as EventListener)
		} else if (elem[key as keyof HTMLElement] === undefined) {
			elem.setAttribute(key, String(attributes[key]))
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(elem as any)[key] = attributes[key]
		}
	}

	return elem
}

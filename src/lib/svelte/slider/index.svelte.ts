import type { Attachment } from 'svelte/attachments'
import { slider as create, type Slider, type SliderOptions } from '../../vanilla/dom/slider/index.js'

/**
 * @module slider
 * @group Svelte
 * @version 1.0.0
 * @remarks
 * Reactive wrapper around the vanilla {@link slider}. Call it to get a controller, then
 * hand `attach` to the element holding your slides — the slides stay your markup, so no
 * wrapper component takes them over.
 *
 * `index`, `length`, `per_page`, `at_start` and `at_end` are reactive, so arrows, dots and
 * counters need no event plumbing. Every method is safe to call before the element mounts,
 * where it simply does nothing.
 *
 * Options are read once, when the element mounts. That keeps the attachment free of
 * reactive dependencies, so it never tears the slider down and rebuilds it — vary the
 * visible slide count with a `per_page` breakpoint map rather than reactive state.
 *
 * @param options - Options for the underlying slider
 * @returns A reactive controller
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { slider } from 'kitto/svelte'
 *
 *   const reel = slider({ loop: true, per_page: { 0: 1, 640: 2 } })
 * </script>
 *
 * <div {@attach reel.attach}>
 *   <img src="1.jpg" alt="" />
 *   <img src="2.jpg" alt="" />
 * </div>
 *
 * <button onclick={() => reel.prev()} disabled={reel.at_start}>Prev</button>
 * <button onclick={() => reel.next()} disabled={reel.at_end}>Next</button>
 *
 * {#each Array.from({ length: reel.length }) as _, i (i)}
 *   <button onclick={() => reel.go_to(i)} aria-current={reel.index === i}></button>
 * {/each}
 * ```
 */
export interface SliderController {
	/** Attach the slider to the element holding your slides. */
	readonly attach: Attachment<HTMLElement>
	/** Index of the leading visible slide. Reactive. */
	readonly index: number
	/** Number of slides. Reactive. */
	readonly length: number
	/** Slides currently visible at once. Reactive. */
	readonly per_page: number
	/** Whether the slider cannot go back any further. Always `false` when looping. */
	readonly at_start: boolean
	/** Whether the slider cannot advance any further. Always `false` when looping. */
	readonly at_end: boolean
	/** Advance by `count` slides. */
	next(count?: number): void
	/** Go back by `count` slides. */
	prev(count?: number): void
	/** Jump to a slide by index. */
	go_to(index: number): void
	/** Insert a slide at `index`. */
	insert(item: HTMLElement, index: number): void
	/** Remove the slide at `index`. */
	remove(index: number): void
	/** Insert a slide at the start. */
	prepend(item: HTMLElement): void
	/** Insert a slide at the end. */
	append(item: HTMLElement): void
	/** Start autoplay, if an `autoplay` interval was set. */
	play(): void
	/** Stop autoplay. */
	pause(): void
	/** Re-measure and re-render. */
	update(): void
}

export function slider(options: SliderOptions = {}): SliderController {
	let instance: Slider | undefined
	let index = $state(options.start_index ?? 0)
	let length = $state(0)
	let per_page = $state(1)

	function sync(): void {
		if (!instance) return
		index = instance.index
		length = instance.length
		per_page = instance.per_page
	}

	/** Wrap a method so state stays in sync, and so calls before the element mounts are harmless. */
	function control<A extends unknown[]>(method: (slider: Slider, ...args: A) => void) {
		return (...args: A) => {
			if (!instance) return
			method(instance, ...args)
			sync()
		}
	}

	const attach: Attachment<HTMLElement> = node => {
		instance = create(node, options)
		sync()
		node.addEventListener('sliderchange', sync)

		return () => {
			node.removeEventListener('sliderchange', sync)
			instance?.destroy()
			instance = undefined
		}
	}

	return {
		attach,
		get index() {
			return index
		},
		get length() {
			return length
		},
		get per_page() {
			return per_page
		},
		get at_start() {
			return !options.loop && index === 0
		},
		get at_end() {
			return !options.loop && index >= length - per_page
		},
		next: control((slider, count?: number) => slider.next(count)),
		prev: control((slider, count?: number) => slider.prev(count)),
		go_to: control((slider, target: number) => slider.go_to(target)),
		insert: control((slider, item: HTMLElement, target: number) => slider.insert(item, target)),
		remove: control((slider, target: number) => slider.remove(target)),
		prepend: control((slider, item: HTMLElement) => slider.prepend(item)),
		append: control((slider, item: HTMLElement) => slider.append(item)),
		play: control(slider => slider.play()),
		pause: control(slider => slider.pause()),
		update: control(slider => slider.update())
	}
}

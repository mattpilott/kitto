<script lang="ts">
	/**
	 * Overlay – design overlay for pixel-perfect implementation.
	 *
	 * **Props:** Pass at least one of `mobile` or `desktop` with the image path. You can append
	 * an optional design width in pixels using `@`, e.g. `"/mobile.jpg@393"` or `"/desktop.jpg@1920"`.
	 * The width sets the overlay’s intrinsic size (defaults: mobile 393px, desktop 1920px).
	 *
	 * **Keyboard:** 1–9 = opacity 10–90%; 0 = 100%, 00 = 0%. Shift + ↑/↓ = shift overlay;
	 * add Ctrl for finer steps. Shift + ↑ and ↓ together = reset shift.
	 */
	import { SvelteSet } from 'svelte/reactivity'
	import { storable } from '../storable/index.js'

	/**
	 * Overlay props. Provide at least one of `mobile` or `desktop`.
	 */
	interface Props {
		/**
		 * Image path for the mobile overlay (used below 640px). Optional design width in px
		 * can be appended with `@`, e.g. `"/mobile.jpg@393"`. Default width is 393.
		 */
		mobile?: string
		/**
		 * Image path for the desktop overlay (640px and up). Optional design width in px
		 * can be appended with `@`, e.g. `"/desktop.jpg@1920"`. Default width is 1920.
		 */
		desktop?: string
	}

	let { mobile, desktop }: Props = $props()

	// Use whichever is provided; if only one is passed, use it for both breakpoints
	const effectiveMobile = $derived(mobile ?? desktop)
	const effectiveDesktop = $derived(desktop ?? mobile)
	const hasOverlay = $derived(effectiveMobile != null || effectiveDesktop != null)

	const msrc = $derived(effectiveMobile?.split('@')[0] ?? '')
	const dsrc = $derived(effectiveDesktop?.split('@')[0] ?? '')
	const msize = $derived(effectiveMobile?.split('@')[1] ?? '393')
	const dsize = $derived(effectiveDesktop?.split('@')[1] ?? '1920')

	$effect(() => {
		if (!hasOverlay) {
			console.warn(
				'[Overlay] No overlay image provided. Pass a `mobile` and/or `desktop` prop with the image path(s), e.g. <Overlay mobile="/mobile.jpg" desktop="/desktop.jpg" />'
			)
		}
	})

	const overlay = storable({ opacity: '0.0', shift: '0px' }, 'overlay')

	let innerWidth: number = $state(0)
	let innerHeight: number = $state(0)

	$effect(() => {
		document.documentElement.dataset.viewport = `${innerWidth} x ${innerHeight}`
	})

	let last_key_pressed: string | null = null
	let last_key_press_time: number = 0
	let array_keys = new SvelteSet<string>()

	function keydown({
		code,
		shiftKey,
		ctrlKey,
		altKey,
		metaKey
	}: {
		code: string
		shiftKey: boolean
		ctrlKey: boolean
		altKey: boolean
		metaKey: boolean
	}) {
		const now: number = Date.now()

		if (shiftKey && altKey && code === 'ArrowUp') {
			$overlay.shift = '0px'
			array_keys.clear()
			return
		}

		if (shiftKey && (code === 'ArrowDown' || code === 'ArrowUp')) {
			array_keys.add(code)

			if (array_keys.has('ArrowDown') && array_keys.has('ArrowUp')) {
				$overlay.shift = '0px'
				array_keys.clear()
			} else {
				const delta: number = code === 'ArrowDown' ? 1 : -1
				const multiplier: number = ctrlKey ? 1 : 10

				$overlay.shift = (parseInt($overlay.shift) || 0) + delta * multiplier + 'px'
			}
		} else {
			const key: string = code.replace('Digit', '')

			if (isFinite(Number(key))) {
				if (key === '0' && (ctrlKey || metaKey)) {
					return
				}
				if (key === '0') {
					$overlay.opacity = last_key_pressed === '0' && now - last_key_press_time < 500 ? '0' : '1'
				} else {
					$overlay.opacity = '0.' + key
				}
				last_key_pressed = key
				last_key_press_time = now
			}
		}
	}

	function keyup({ code }: { code: string }) {
		array_keys.delete(code)
	}

	function portal(node: HTMLElement) {
		const target =
			typeof document !== 'undefined' ? (document.querySelector('body > div') ?? document.body) : null
		if (target) target.prepend(node)
		return {
			destroy() {
				node.remove()
			}
		}
	}
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} bind:innerHeight bind:innerWidth />

{#if hasOverlay && $overlay.opacity !== '0'}
	<picture class="overlay" style="--mobile:{msize}px; --desktop:{dsize}px" use:portal>
		<source srcset={dsrc || msrc} media="(min-width: 640px)" />
		<img
			class="img"
			style:opacity={$overlay.opacity}
			style:margin-top={$overlay.shift}
			src={msrc || dsrc}
			alt="Overlay"
		/>
	</picture>
{/if}

<style>
	.overlay {
		display: block;
		height: auto;
		max-width: 100%;
		overflow: clip;
		pointer-events: none;
		position: absolute;
		top: 0;
		width: 100%;
		z-index: 1000;
	}

	.img {
		left: 50%;
		max-width: none;
		opacity: 0;
		position: relative;
		transition:
			opacity 0.3s ease,
			margin-top 0.3s ease;
		transform: translateX(-50%);
		width: var(--mobile, 393px);
	}

	@media (min-width: 640px) {
		.img {
			width: var(--desktop, 1920px);
		}
	}
</style>

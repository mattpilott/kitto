<script lang="ts">
	import '../app.css'
	import Overlay from '$lib/svelte/overlay/index.svelte'
	import { slider } from '$lib/svelte/index.js'

	let innerWidth: number = $state(0)

	// Options are read once at mount, so each variant needs its own controller
	const basic = slider({ loop: true, autoplay: 4000, label: 'Looping showcase' })
	const responsive = slider({ per_page: { 0: 1, 640: 2, 1024: 3 }, label: 'Responsive reel' })
	const editable = slider({ per_page: 2, label: 'Editable reel' })

	let added = $state(0)

	const indices = (count: number) => Array.from({ length: count }, (_, i) => i)

	function add() {
		editable.append(make_slide(`new ${++added}`))
	}

	/** The vanilla API takes real elements, so slides added at runtime are built by hand. */
	function make_slide(text: string) {
		const slide = document.createElement('div')
		const box = document.createElement('span')

		slide.className = 'slide'
		box.textContent = text
		slide.append(box)

		return slide
	}
</script>

<svelte:window bind:innerWidth />

<h1>kitto slider {innerWidth}px</h1>

<section>
	<h2>Looping, autoplay every 4s</h2>
	<p>Drag it, or focus it and use the arrow keys. Autoplay pauses on hover and focus.</p>

	<div class="reel" {@attach basic.attach}>
		{#each indices(6) as i (i)}
			<div class="slide" style="--h: {i * 55}"><span>{i + 1}</span></div>
		{/each}
	</div>

	<div class="controls">
		<button onclick={() => basic.prev()} disabled={basic.at_start}>Prev</button>
		<button onclick={() => basic.next()} disabled={basic.at_end}>Next</button>
		<button onclick={basic.pause}>Pause</button>
		<button onclick={basic.play}>Play</button>
		<span>{basic.index + 1} of {basic.length}</span>
	</div>

	<div class="controls">
		{#each indices(basic.length) as i (i)}
			<button
				class="dot"
				aria-label="Go to slide {i + 1}"
				aria-current={basic.index === i ? 'true' : undefined}
				onclick={() => basic.go_to(i)}
			></button>
		{/each}
	</div>
</section>

<section>
	<h2>Responsive — 1 / 2 / 3 across the breakpoints</h2>
	<p>
		Resize the window to watch <code>per_page</code> change without a rebuild. The arrows disable at the ends. The
		link and input should stay usable, and dragging the link must not navigate.
	</p>

	<div class="reel" {@attach responsive.attach}>
		{#each indices(7) as i (i)}
			<div class="slide" style="--h: {200 + i * 20}">
				<span>
					{i + 1}
					{#if i === 1}<a href="https://svelte.dev">a link</a>{/if}
					{#if i === 2}<input aria-label="test input" size="6" />{/if}
				</span>
			</div>
		{/each}
	</div>

	<div class="controls">
		<button onclick={() => responsive.prev()} disabled={responsive.at_start}>Prev</button>
		<button onclick={() => responsive.next()} disabled={responsive.at_end}>Next</button>
		<span>
			index {responsive.index} · per_page {responsive.per_page} · length {responsive.length}
		</span>
	</div>
</section>

<section>
	<h2>Adding and removing slides</h2>

	<div class="reel" {@attach editable.attach}>
		{#each indices(4) as i (i)}
			<div class="slide" style="--h: {i * 90}"><span>{i + 1}</span></div>
		{/each}
	</div>

	<div class="controls">
		<button onclick={() => editable.prev()} disabled={editable.at_start}>Prev</button>
		<button onclick={() => editable.next()} disabled={editable.at_end}>Next</button>
		<button onclick={add}>Append</button>
		<button onclick={() => editable.remove(editable.index)} disabled={editable.length === 0}>
			Remove current
		</button>
		<span>index {editable.index} · length {editable.length}</span>
	</div>
</section>

<Overlay desktop="/desktop.png" />

<style lang="css">
	h1 {
		color: red;
		font: 600 var(--f-h1);

		@media (--from-mobile) {
			color: green;
		}

		@media (--from-tablet) {
			color: blue;
		}

		@media (--from-desktop) {
			color: black;
		}
	}

	section {
		margin-block: 3rem;
	}

	.reel {
		border: 1px solid #0002;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-block-start: 0.75rem;
	}

	.dot {
		width: 1rem;
		height: 1rem;
		padding: 0;
		border: 1px solid #0004;
		border-radius: 50%;
		background: none;

		&[aria-current] {
			background: #333;
		}
	}

	/*
	 * Global because slides appended at runtime are created with document.createElement,
	 * so they never receive svelte's scoping class. Loop clones keep it, since they are cloned.
	 */
	:global(.slide) {
		/* gap on the track would break the 100% / per_page maths, so slides pad themselves */
		padding-inline: 0.25rem;
	}

	:global(.slide > span) {
		display: grid;
		place-items: center;
		gap: 0.5rem;
		min-height: 10rem;
		background: hsl(var(--h, 0) 65% 75%);
		font: 600 2rem var(--f-family);
	}
</style>

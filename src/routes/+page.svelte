<script lang="ts">
	import '../app.css'
	import Overlay from '$lib/svelte/overlay/index.svelte'

	let innerWidth: number = $state(0)
</script>

<svelte:window bind:innerWidth />

<h1>Welcome to your library project {innerWidth}</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Overlay desktop="/desktop.png" />

<style lang="css">
	h1 {
		color: red;

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
</style>

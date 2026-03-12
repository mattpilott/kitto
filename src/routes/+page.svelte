<script lang="ts">
	import '../app.css'
	import Overlay from '$lib/svelte/overlay/index.svelte'
</script>

<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Overlay desktop="/desktop.png" />

<style lang="css">
	h1 {
		color: red;

		@media (--from-tablet) {
			color: blue;
		}
	}
</style>

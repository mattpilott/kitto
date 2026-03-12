<script lang="ts">
	import '$lib/styles/unify.css'
	import Overlay from '$lib/svelte/overlay/index.svelte'
</script>

<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<Overlay mobile="/mobile.jpg" desktop="/desktop.jpg" />

<style lang="css">
	h1 {
		color: red;
		size: 100px;
	}
</style>

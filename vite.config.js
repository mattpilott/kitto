import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	test: {
		include: ['lib/**/test.js'],
		benchmark: { include: ['lib/**/bench.js'] }
	},
	resolve: {
		alias: [{ find: '$lib', replacement: resolve(__dirname, './lib') }]
	},
	css: {
		transformer: 'lightningcss'
	},
	build: {
		cssMinify: 'lightningcss',
		lib: {
			entry: resolve(__dirname, 'lib/index.js'),
			fileName: 'kitto',
			formats: ['es']
		}
		// rollupOptions: {
		//    output: {
		//       globals: { 'svelte/store': 'sveltestore' }
		//    },
		//    external: ['svelte/store'],
		//    treeshake: { moduleSideEffects: false }
		// }
	}
})

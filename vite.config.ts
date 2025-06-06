import { svelteTesting } from '@testing-library/svelte/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 1313
	},
	test: {
		coverage: {
			include: ['src/**/*.{js,ts}'],
			exclude: [
				'src/**/{test,spec,bench}.{js,ts}',
				'src/lib/vanilla/index.ts',
				'src/lib/vite/index.ts',
				'src/lib/lightningcss/index.ts'
			]
		},
		benchmark: { include: ['src/**/bench.{js,ts}'] },
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*/test.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*/test.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
})

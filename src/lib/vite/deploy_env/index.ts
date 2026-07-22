/**
 * @module deploy_env
 * @group Vite
 * @version 1.0.0
 * @remarks
 * Detects the build-time environment so it can be baked into the bundle via `define`.
 * `vite dev` → development; otherwise reads whichever host's native build signal is
 * present. These vars only exist at build time, which is exactly why the result is
 * baked rather than read at runtime.
 *
 * Detection order:
 * 1. `APP_ENV` — optional explicit override for any host (`preview` | `production`)
 * 2. Vercel — `VERCEL_ENV` (production | preview | development)
 * 3. Netlify — `CONTEXT` (production | deploy-preview | branch-deploy)
 * 4. Cloudflare Pages + Workers Builds — `CF_PAGES_BRANCH` / `WORKERS_CI_BRANCH` (production = main)
 * 5. Falls back to production
 *
 * @param command - The `command` from vite's `defineConfig` callback (`serve` | `build`).
 * @returns The detected environment.
 *
 * @example
 * ```ts
 * // vite.config.js
 * import { deploy_env } from 'kitto/vite'
 *
 * export default defineConfig(({ command }) => ({
 *   define: {
 *     'import.meta.env.environment': JSON.stringify(deploy_env(command))
 *   }
 * }))
 * ```
 */
export function deploy_env(command: string): 'development' | 'preview' | 'production' {
	if (command === 'serve') return 'development'
	const e = process.env
	if (e.APP_ENV === 'preview' || e.APP_ENV === 'production') return e.APP_ENV
	if (e.VERCEL_ENV) return e.VERCEL_ENV === 'production' ? 'production' : 'preview'
	if (e.CONTEXT) return e.CONTEXT === 'production' ? 'production' : 'preview'
	const branch = e.CF_PAGES_BRANCH ?? e.WORKERS_CI_BRANCH
	if (branch) return branch === 'main' ? 'production' : 'preview'
	return 'production'
}

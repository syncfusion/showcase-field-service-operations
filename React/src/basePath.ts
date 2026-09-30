/**
 * Runtime base-path resolution for the Field Service Operations React showcase.
 *
 * One build is usable both through the public vanity path
 * (`/field-service-ops/react`) and directly from the Azure App Service root
 * (`/`). The mount path is a fixed constant so the same compiled bundle works
 * in both hosting configurations without rebuilding.
 *
 * Why a fixed constant and not `import.meta.env.BASE_URL`:
 * Vite's `base` (set from `APP_BASE_PATH` in `vite.config.ts`) bakes the prefix
 * into every asset URL at build time, so a single build is pinned to one
 * mount path. This runtime helper exists for code that must reason about the
 * current location at runtime (e.g. absolute PDF/asset URLs constructed from
 * `window.location`, or deep-link comparisons) and should stay in sync with
 * the value the bundle was built under. Keep this constant identical to the
 * `APP_BASE_PATH` used at build time, and to the IIS rewrite prefix in
 * `public/web.config`.
 */

/** Public vanity mount path for the React app. Keep in sync with vite.config.ts and web.config. */
export const PUBLIC_BASE_PATH = '/field-service-ops/react';

/**
 * Returns the base path the app is currently served under, based on the
 * browser's pathname. When the app is accessed through the vanity path it
 * returns that path; when accessed directly from the App Service root it
 * returns `/`.
 */
export function getPublicBasePath(pathname = window.location.pathname): string {
  return pathname === PUBLIC_BASE_PATH ||
    pathname.startsWith(`${PUBLIC_BASE_PATH}/`)
    ? PUBLIC_BASE_PATH
    : '/';
}

/**
 * Same as `getPublicBasePath` but returns an empty string at the root
 * (`/`) instead of `/`. Use this when concatenating with an already-rooted
 * asset path so you don't produce a `//` double-slash, e.g.
 * `window.location.origin + getAssetBasePath() + '/assets/logo.png'`.
 */
export function getAssetBasePath(pathname = window.location.pathname): string {
  const base = getPublicBasePath(pathname);
  return base === '/' ? '' : base;
}

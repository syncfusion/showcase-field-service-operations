#!/usr/bin/env node
// Production static host for the Field Service Operations public JSON showcase.
// Serves the Vite build output (dist/) with SPA fallback routing, /healthz
// monitoring endpoint, immutable caching for hashed assets, and no-cache for
// index.html so releases appear immediately.
// JSON profile: changes stay in the current browser tab only; reload or
// "Reset sample data" restores the bundled JSON baseline. No API, no database.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, posix } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('./dist', import.meta.url));
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || '0.0.0.0';

// The build's Vite `base` (APP_BASE_PATH, default below) makes every asset
// reference in the built HTML/JS absolute under that prefix, but Vite still
// writes files flat into dist/ (dist/assets/*, never dist/<prefix>/assets/*).
// Strip the same prefix here before resolving a file, mirroring the IIS
// rewrite rule public/web.config uses for Windows App Service hosting — see
// factory/standards/publishing-base-path.md's "Linux App Service hosting"
// section. Default to the vanity mount path so Azure just works after a zip
// deploy without requiring an App Setting; set APP_BASE_PATH=/ explicitly to
// serve a root build at the App Service root (no redirect, no stripping).
const mountPath = (process.env.APP_BASE_PATH ?? '/field-service-ops/react').replace(/\/$/, '');

// Canonical public vanity path: when mountPath is non-empty the redirect below
// already sends `/` → mountPath. When the app is deployed as a root build
// (APP_BASE_PATH=/ → mountPath=''), ROOT_REDIRECT provides the vanity path to
// show in the browser. Defaults to the standard showcase vanity path; set to ''
// to disable the root redirect entirely.
const rootRedirect = mountPath
  ? ''
  : (process.env.ROOT_REDIRECT ?? '/field-service-ops/react').replace(/\/$/, '');
function stripMountPath(pathname) {
  if (!mountPath) return pathname;
  if (pathname === mountPath || pathname.startsWith(`${mountPath}/`)) {
    return pathname.slice(mountPath.length) || '/';
  }
  return pathname;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

// Vite assets look like /assets/index-jO9qD4dd.js (name + '-' + content hash).
// All content-hashed files are safe to cache for a year; index.html is not.
const isHashedAsset = (pathname) => /\/assets\/[^/]+[-.][0-9a-zA-Z_]{6,}\.(js|mjs|css|woff2?|png|svg|jpg|jpeg|ico|map)$/.test(pathname) || /\/assets\/[^/]+[-.][0-9a-zA-Z__-]{8,}\.(woff|ttf|eot)$/.test(pathname);

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const send = (status, body, headers) => {
    response.writeHead(status, { 'content-length': Buffer.byteLength(body), ...headers });
    response.end(body);
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return send(405, `Method ${request.method} not allowed`, { 'allow': 'GET, HEAD' });
  }

  // When the app is built/served under a mount path (APP_BASE_PATH), redirect
  // the bare root (`/`) to that mount path so opening localhost:8080 lands on
  // the app at its expected base path. Deep links under the mount path are
  // already correct; only the bare root needs the nudge. Disabled when no mount
  // path is set (default `/` build served at root).
  if (mountPath && (url.pathname === '/' || url.pathname === '')) {
    response.writeHead(302, { location: `${mountPath}/${url.search ?? ''}${url.hash ?? ''}` });
    return response.end();
  }

  // When the app is a root build (mountPath='') but a canonical vanity URL is
  // configured (ROOT_REDIRECT), redirect bare `/` to that vanity path so the
  // public Azure URL always shows /field-service-ops/react in the address bar.
  if (rootRedirect && (url.pathname === '/' || url.pathname === '')) {
    response.writeHead(302, { location: `${rootRedirect}${url.search ?? ''}` });
    return response.end();
  }

  if (url.pathname === '/healthz') {
    // Liveness/readiness for Azure App Service health checks.
    const healthy = existsSync(join(distDir, 'index.html'));
    return send(healthy ? 200 : 503, JSON.stringify({ status: healthy ? 'ok' : 'missing-build' }), { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  }

  // Decode and normalize; reject traversal outside dist/.
  let pathname;
  try {
    pathname = stripMountPath(decodeURIComponent(url.pathname));
  } catch {
    return send(400, 'Bad request', { 'content-type': 'text/plain; charset=utf-8' });
  }
  const relative = posix.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = normalize(join(distDir, relative));
  if (!filePath.startsWith(distDir)) {
    return send(403, 'Forbidden', { 'content-type': 'text/plain; charset=utf-8' });
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    // SPA fallback: serve index.html for direct routes such as /work-orders.
    const indexPath = join(distDir, 'index.html');
    if (!existsSync(indexPath)) return send(404, 'Build output not found', { 'content-type': 'text/plain; charset=utf-8' });
    const html = createReadStream(indexPath);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache, must-revalidate' });
    html.pipe(response);
    return;
  }

  const type = mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const headers = {
    'content-type': type,
    'x-content-type-options': 'nosniff',
  };
  if (isHashedAsset(pathname)) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['cache-control'] = 'no-cache, must-revalidate';
  }

  const stats = statSync(filePath);
  if (request.method === 'HEAD') {
    response.writeHead(200, { ...headers, 'content-length': stats.size });
    return response.end();
  }
  response.writeHead(200, { ...headers, 'content-length': stats.size });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Field Service Operations public JSON showcase listening on http://${host}:${port}`);
  console.log(`Serving ${distDir} with SPA fallback and /healthz monitoring.`);
});

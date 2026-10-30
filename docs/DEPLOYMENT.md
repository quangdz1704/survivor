# Local preview and Vercel

Source repository: [quangdz1704/survivor](https://github.com/quangdz1704/survivor). The user deployed main commit896c6c6 at https://survivor-rho-azure.vercel.app/ and reported phone play works. The agent has not performed a deployment. Version1.1 content currently remains on local branch `feature/heroes-and-weapons`; production publishing requires an explicit user instruction.

## Local verification

Node.js 22.14+ and npm:

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

Vite dev defaults to 5173; preview defaults to 4173. Override with `-- --port 5181 --strictPort` when another project uses the port. PWA only runs in production/preview. Localhost is a secure context for SW; on another device use an HTTPS preview deployment rather than plain LAN HTTP.

## Vercel configuration

`vercel.json` uses framework Vite, build `npm run build`, output `dist`. No environment variables, credentials, backend or server database required. It sets no-cache for SW and manifest, while generated app bundles have hashed names. Only dist is published: QA pages/source artwork/docs stay local.

When a preview deployment is authorized, import this project into Vercel (or run the Vercel CLI against this directory), set Node 22+, and create a preview first. Verify portrait UI, actual pointer drag, audio unlock, storage reload, 5-minute boss, result/retry, 100–150 enemies, offline launch after first cache and install on physical Android Chrome/iOS Safari before promoting production.

## PWA behavior

Manifest includes Vietnamese name/language,192/512 and maskable icons, portrait orientation and standalone display. Android install button appears only when the browser offers `beforeinstallprompt`; Safari users use Share → Add to Home Screen. First visit must finish caching. Browser/OS can evict offline data; reinstall/cache again if needed.

A new SW waits and shows a refresh action at the main menu, avoiding mid-run reloads. IndexedDB version 1 is independent of the SW cache. Keep the hostname/origin unchanged to preserve existing saves. Clearing site data removes local progress; profiles do not sync to another origin/device.

## Dependency note

2026-10-30 audit: no moderate/high/critical findings; four linked low-severity dev/build findings from deepmerge 4.3.1 through Workbox. The latest deepmerge reported by npm remains 4.3.1. Do not downgrade vite-plugin-pwa to npm audit's suggested 0.2.1; that would remove the intended modern integration. No third-party/untrusted configuration is merged by this static project. Recheck when the build chain publishes a compatible fix.

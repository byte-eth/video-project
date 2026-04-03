---
name: dev-skill
description: >-
  Development guide for the mobile wallet app. Covers project
  structure, tech stack, conventions, and coding patterns. Use when working on
  any feature, debugging, or reviewing code in the project.
---

# Nest VPay Development Guide

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + `<script setup>` + TypeScript |
| Build | Vite 6, vue-tsc |
| Mobile UI | Vant 4 (dark theme, auto-imported) |
| Routing | Vue Router 4 + file-based routing (`unplugin-vue-router`) |
| State | Pinia 3 + `pinia-plugin-persistedstate` |
| HTTP | Axios (wrapped in `src/utils/request.ts`) |
| CSS | UnoCSS (Wind3, attributify, rem-to-px base=4) + Less |
| i18n | vue-i18n 11 (Composition, `zh-CN` / `en-US`) |
| Web3 | @reown/appkit, @wagmi/vue, viem, ethers (BSC chain) |
| Head/SEO | @unhead/vue |
| Auto-imports | unplugin-auto-import (vue, vue-router, vueuse, i18n, unhead, `src/composables`) |

## Project Structure

```
src/
├── pages/            # File-based routes (every .vue → route)
│   ├── index.vue     # Home / wallet overview
│   ├── account/      # Login, register, welcome
│   ├── card/         # Card product, buy, activate, KYC, deposit
│   ├── wallet/       # Recharge, withdraw, records
│   ├── vip/          # VIP membership, output, records
│   ├── agent/        # Agent flows
│   ├── my/           # Profile, ledger, share
│   ├── setting/      # Settings, chat, guide
│   └── [...all].vue  # 404 catch-all
├── components/       # Shared components (NavBar, TabBar, Upload, etc.)
├── composables/      # Business composables (useKycVerify, useCardActivation)
├── stores/           # Pinia stores (user, common, routeCache)
│   └── modules/
├── api/              # API functions (index.ts, pay.ts)
├── utils/            # request.ts, auth.ts, i18n.ts, walletconnect.ts, contracts/
├── config/           # Route whitelist, app config
├── locales/          # zh-CN.json, en-US.json
├── styles/           # app.less, reset.less, font.less
├── types/            # Auto-generated .d.ts files
└── assets/           # Images and static resources
```

## Key Conventions

### SFC Pattern

Every page/component uses `<script setup lang="ts">` with optional `<route>` block:

```vue
<route lang="json5">
{
  name: 'page-name',
  meta: {
    title: '页面标题',
    i18n: 'locales.key',   // preferred — NavBar resolves via t()
    keepAlive: true,        // enable route caching
  },
}
</route>

<script setup lang="ts">
defineOptions({ name: 'page-name' })  // required when keepAlive is true
const { t } = useI18n()
// ...
</script>

<template>
  <!-- Vant components + UnoCSS classes -->
</template>

<style lang="less" scoped>
/* component styles */
</style>
```

### Auto-Imports (no manual import needed)

- **Vue**: `ref`, `computed`, `watch`, `onMounted`, `onActivated`, etc.
- **Vue Router**: `useRoute`, `useRouter`
- **VueUse**: `useLocalStorage`, `useDark`, `useClipboard`, etc.
- **i18n**: `useI18n`
- **Unhead**: `useHead`
- **Composables**: everything exported from `src/composables/`
- **Vant components**: auto-resolved (except Toast/Dialog/Notify/ImagePreview styles)

### UnoCSS

- `baseFontSize: 4` — `w-[24px]` works as `width: 24px` (rem-to-px)
- Theme colors: `primary` (#F1A42E), `lv1` (#fff), `lv3` (#9FA2A7), `card` (#16171B)
- Shortcuts: `flex-center`, `flex-lr`, `flex-y-center`, `flex-align-center`, `no-wrap`
- Attributify mode enabled — classes can go as HTML attributes

### Dark Theme

The app is dark-first:
- `App.vue` wraps everything in `<van-config-provider theme="dark">`
- Global background is `#000`
- Card backgrounds use `rgba(22, 23, 27, 1)` / `#16171B`
- Text colors: white for primary, `rgba(128, 128, 128, 1)` for secondary

### NavBar & TabBar Visibility

`src/config/routes.ts` defines `routeWhiteList` — routes in this list **hide** the NavBar back arrow (tab-level pages). TabBar shows on these routes.

### Auth Flow

- Token stored as `Bearer {token}` under `localStorage['access_token']`
- `src/utils/auth.ts`: `isLogin()`, `getToken()`, `setToken()`, `clearToken()`
- Router guard redirects unauthenticated users to `/account/login?redirect=...`
- Whitelist: `'/'`, `/account/wellcome`, `/account/login`, `/account/register`, `/setting/login`, `/404`
- Deep link support: `?token=xxx` auto-saves and strips from URL; `?inviteCode=xxx` → localStorage

### i18n

- Locale files: `src/locales/zh-CN.json`, `src/locales/en-US.json`
- Use `t('key')` or `$t('key')` in templates
- Route titles: prefer `meta.i18n` key over `meta.title` for NavBar localization
- `locale` reactive computed from `src/utils/i18n.ts`; Vant locale auto-synced

### State Management (Pinia)

- `useUserStore`: `userInfo`, `loginInfo`, `getUserInfo()` — persisted
- `useCommonStore`: `coin`, `coinWihdraw`, `card`, `appInfo` — persisted
- `useRouteCacheStore`: tracks keepAlive route names for `<keep-alive :include>`
- Use **Setup Store syntax** (function form of `defineStore`)

### Storage Keys

```ts
STORAGE_TOKEN_KEY = 'access_token'
STORAGE_LANG_KEY = 'app_lang'
STORAGE_INVITE_KEY = 'invite_code'
STORAGE_SHOW_BALANCE_KEY = 'show_balance'
```

## Build & Deploy

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (HTTPS, port 3000) |
| `npm run build` | Production (typecheck + vite build, terser drops console) |
| `npm run build:dev` | Dev/test build |
| `npm run build:box` | Box environment build |
| `npm run lint:fix` | ESLint auto-fix |

- Requires **Node 18+**, install with `npm i --force`
- Env vars: `VITE_APP_API_BASE_URL`, `VITE_APP_TENANT_ID`, `VITE_APP_PUBLIC_PATH`, `VITE_APP_OUT_DIR`
- Deploy: Nginx with SPA fallback `try_files $uri $uri/ /index.html`

## ESLint

Uses `@antfu/eslint-config` with Vue + TypeScript + UnoCSS. Notable overrides:
- `eqeqeq: 'off'` (loose equality allowed)
- Perfectionist sorting rules disabled

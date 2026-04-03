---
name: api-request
description: >-
  Guide for working with the API layer in the project. Covers
  Axios request utilities, adding new API endpoints, error handling, and
  Pinia store integration. Use when adding API calls, modifying HTTP requests,
  or debugging API issues.
---

# Nest VPay API Layer Guide

## Architecture

```
src/
├── utils/request.ts    # Axios instance + requestPost/requestJsonPost/requestGet
├── api/index.ts        # Main API surface (auth, user, card, KYC, VIP, etc.)
├── api/pay.ts          # Pay-specific APIs (recharge, withdraw, records)
├── api/format.ts       # Response formatters
└── api/typing.ts       # API type definitions
```

## Request Utilities (`src/utils/request.ts`)

Three request helpers wrap Axios with unified loading/error handling:

```ts
requestPost(url, params?, loadingMsg?, showError?, isForm?)
// Default: form-encoded POST (isForm=true)

requestJsonPost(url, params?, loadingMsg?, showError?)
// JSON body POST

requestGet(url, params?, loadingMsg?, showError?)
// GET with query params
```

**Parameters:**

| Param | Type | Default | Purpose |
|-------|------|---------|---------|
| `url` | `string` | — | API path (relative to `VITE_APP_API_BASE_URL`) |
| `params` | `any` | — | Request body/query params |
| `loadingMsg` | `string` | `''` | If non-empty, shows Vant `showLoadingToast` |
| `showError` | `boolean` | `true` | Auto-show `showNotify` on `code !== 0` |
| `isForm` | `boolean` | `true` | (POST only) Use `postForm` vs `post` |

**Response format:** Backend returns `{ code, data, msg }`. Helpers resolve with `data` on success, reject with the full response on error.

## Interceptors

**Request interceptor** adds:
- `language` header (current i18n locale)
- `Authorization` header (from `localStorage['access_token']`)
- `tenant-id` header (from `VITE_APP_TENANT_ID`, skipped for `/app-api/infra` URLs)
- Duplicate request cancellation via CancelToken

**Response interceptor:**
- `code === 401` → clear token, redirect to `/account/login`
- `status === 403` → show error notification

## Adding a New API Endpoint

### 1. Define the function in `src/api/index.ts` (or `pay.ts`)

Follow the established pattern:

```ts
// 功能描述 - 接口说明（中文注释）
export async function queryFeatureName(params: any, loadingMsg?: string): Promise<any> {
  return requestPost('/saas/module/action', params, loadingMsg)
}
```

**Naming convention:**
- `query*` — for GET queries: `queryUserInfo`, `queryGetAssetsCoinList`
- `fetch*` — for GET fetches: `fetchKycVerifyStatus`, `fetchCardLevelList`
- `create*` / `add*` — for creation: `createMasterAddress`, `addCard`
- `update*` / `set*` / `modify*` — for updates: `updateLoginPassword`, `setAlias`, `modifyPin`
- `delete*` / `delet*` — for deletion: `deletMasterAddress`
- `get*` — for simple getters: `getCardNo`, `getPaymentList`

**Choose the right helper:**

| Helper | When to use |
|--------|------------|
| `requestPost` | Most mutations (default form-encoded) |
| `requestJsonPost` | When backend expects JSON body (e.g. complex objects, pagination) |
| `requestGet` | All read operations |

### 2. Use in a page/component

```vue
<script setup lang="ts">
import { queryFeatureName } from '@/api'

const data = ref(null)

onMounted(async () => {
  try {
    data.value = await queryFeatureName({ id: 1 })
  } catch (err) {
    // Error already shown by request.ts if showError=true
  }
})
```

### 3. Show loading (optional)

Pass a loading message as the second argument:

```ts
await queryFeatureName(params, t('common.loading'))
```

This shows a Vant `showLoadingToast` with `forbidClick: true` during the request.

### 4. Suppress error toast (optional)

Set `showError: false` for cases where you handle errors manually:

```ts
await fetchKycVerifyStatus('', false)
```

## Integrating with Pinia Store

For data that needs to be shared across pages, add to a store:

```ts
// src/stores/modules/feature.ts
import { defineStore } from 'pinia'
import { queryFeatureData } from '@/api'

export default defineStore('feature', () => {
  const data = ref<any>(null)

  const fetchData = async () => {
    data.value = await queryFeatureData()
  }

  return { data, fetchData }
}, {
  persist: true,  // add if data should survive refresh
})
```

Export from `src/stores/index.ts`:

```ts
import useFeatureStore from './modules/feature'
export { useUserStore, useCommonStore, useFeatureStore }
```

## API Path Prefixes

| Prefix | Service |
|--------|---------|
| `/saas/auth/` | Authentication |
| `/saas/user/` | User management |
| `/saas/vpay/card/` | Card operations |
| `/saas/vpay/user/` | VPay user (address, KYC) |
| `/saas/vpay/cardholder/` | Cardholder KYC |
| `/saas/vpay/kyc/` | KYC verification |
| `/saas/vpay/payment/` | Payment methods |
| `/saas/assetsRecord/` | Asset records |
| `/saas/pay/` | Recharge/withdraw |
| `/saas/app/kefu/` | Customer service chat |
| `/saas/app/vpay/` | VIP/agent features |
| `/apps/mmc/card/` | MMC card service |
| `/apps/assets/` | Asset display |
| `/apps/user/` | User bills |
| `/infra/file/` | File upload |

## Composable Pattern for Complex API Logic

When API logic involves loading state, error handling, and lifecycle hooks, extract to a composable:

```ts
// src/composables/useFeature.ts
import { ref, onMounted } from 'vue'
import { queryFeatureData } from '@/api'

export function useFeature() {
  const loading = ref(true)
  const data = ref<any>(null)

  const fetch = async () => {
    loading.value = true
    try {
      data.value = await queryFeatureData()
    } catch (e) {
      // handle
    } finally {
      loading.value = false
    }
  }

  onMounted(fetch)

  return { loading, data, refresh: fetch }
}
```

Composables in `src/composables/` are auto-imported — no manual import needed in pages.

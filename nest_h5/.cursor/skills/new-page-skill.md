---
name: new-page-skill
description: >-
  Guide for creating new pages and routes in the project.
  Covers file-based routing, route metadata, keepAlive, NavBar/TabBar config,
  and page template. Use when adding a new page, route, or view.
---

# Creating New Pages in Nest VPay

## File-Based Routing

Routes are auto-generated from `src/pages/`. No manual router config needed.

| File Path | Generated Route |
|-----------|----------------|
| `src/pages/index.vue` | `/` |
| `src/pages/card/index.vue` | `/card` |
| `src/pages/card/buy.vue` | `/card/buy` |
| `src/pages/card/[id].vue` | `/card/:id` (dynamic) |
| `src/pages/[...all].vue` | `/:all(.*)` (catch-all) |

Reference: `src/router/README.md` and [unplugin-vue-router docs](https://uvr.esm.is/).

## Step-by-Step

### 1. Create the `.vue` file

Place it under `src/pages/` following the directory convention above.

### 2. Add the route block

```vue
<route lang="json5">
{
  name: 'feature-name',
  meta: {
    i18n: 'pages.feature.title',  // NavBar title (i18n key)
    keepAlive: false,
  },
}
</route>
```

**Route meta options:**

| Field | Type | Purpose |
|-------|------|---------|
| `title` | `string` | Static NavBar title (non-i18n fallback) |
| `i18n` | `string` | i18n key for NavBar title (preferred) |
| `keepAlive` | `boolean` | Cache component with `<keep-alive>` |
| `prefetch` | `boolean` | Prefetch route chunk |

### 3. Write the script setup

```vue
<script setup lang="ts">
// defineOptions required when keepAlive is true
defineOptions({ name: 'feature-name' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Page data
const loading = ref(false)
const list = ref([])

// Fetch on mount (or onActivated for keepAlive pages)
onMounted(async () => {
  loading.value = true
  try {
    list.value = await someApiCall()
  } finally {
    loading.value = false
  }
})
</script>
```

### 4. Build the template

Use Vant components + UnoCSS classes. Dark theme is inherited globally.

**UnoCSS + scoped Less:** Follow `nest_h5/.cursor/rules/nest-h5-vue.mdc` (explicit `Npx` utilities, no `uno.config.ts` shortcuts; `<style lang="less" scoped>` with `:deep` / `:global` for Teleport as documented there).

```vue
<template>
  <div class="page px-16px pt-16px pb-72px">
    <!-- content -->
  </div>
</template>
```

Common page padding: `padding: 16px 16px 72px 16px` (bottom space for TabBar).

### 5. Add styles

See the same `nest_h5/.cursor/rules/nest-h5-vue.mdc` (scoped Less / `:deep` / Teleport).

```vue
<style lang="less" scoped>
.page {
  padding: 32px 16px 72px 16px;
  box-sizing: border-box;
}
</style>
```

### 6. Add i18n keys

Add entries to both `src/locales/zh-CN.json` and `src/locales/en-US.json`:

```json
{
  "pages": {
    "feature": {
      "title": "Feature Title",
      "someLabel": "Label"
    }
  }
}
```

### 7. Configure visibility (if needed)

**Tab-level pages** (no back arrow, TabBar visible): Add route name to `src/config/routes.ts`:

```ts
export const routeWhiteList: readonly string[] = [
  '/',
  'wallet',
  'card',
  'my',
  'your-new-tab',  // add here
]
```

**Auth-free pages**: Add path to the whitelist in `src/router/index.ts`:

```ts
const whiteList = ['/', '/account/wellcome', '/account/login', '/account/register', '/setting/login', '/404']
```

## Page with List Pattern (common)

```vue
<route lang="json5">
{
  name: 'feature-list',
  meta: { i18n: 'pages.feature.title' },
}
</route>

<script setup lang="ts">
const loading = ref(false)
const finished = ref(false)
const list = ref<any[]>([])
const pageNo = ref(1)

async function onLoad() {
  loading.value = true
  try {
    const res = await fetchList({ pageNo: pageNo.value, pageSize: 20 })
    list.value.push(...(res.list || []))
    finished.value = !res.list?.length || list.value.length >= res.total
    pageNo.value++
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <van-list v-model:loading="loading" :finished="finished" @load="onLoad">
      <div v-for="item in list" :key="item.id">
        <!-- item content -->
      </div>
    </van-list>
  </div>
</template>
```

## Page with Form Pattern (common)

```vue
<script setup lang="ts">
const form = ref({ name: '', amount: '' })

async function onSubmit() {
  await submitApi(form.value, t('common.loading'))
  showToast(t('common.success'))
  router.back()
}
</script>

<template>
  <div class="page">
    <van-form @submit="onSubmit">
      <van-field v-model="form.name" :label="t('field.name')" :rules="[{ required: true }]" />
      <van-field v-model="form.amount" type="digit" :label="t('field.amount')" />
      <van-button round block type="primary" native-type="submit">
        {{ t('common.submit') }}
      </van-button>
    </van-form>
  </div>
</template>
```

<script setup lang="ts">
import useRouteCache from '@/stores/modules/routeCache'

useHead({
  title: 'Nest',
  meta: [
    {
      name: 'description',
      content: 'Nest',
    },
    {
      name: 'theme-color',
      content: () => isDark.value ? '#ffffff' : '#000000',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: () => preferredDark.value ? '/favicon-dark.svg' : '/favicon.svg',
    },
  ],
})

const keepAliveRouteNames = computed(() => {
  return useRouteCache().routeCaches as string[]
})

</script>

<template>
  <van-config-provider theme="dark">
    <router-view v-slot="{ Component, route }">
      <section class="app-wrapper">
        <keep-alive :include="keepAliveRouteNames">
          <component :is="Component" :key="route.name" />
        </keep-alive>
      </section>
    </router-view>
    <TabBar />
  </van-config-provider>
</template>

<style scoped>
.app-wrapper {
  width: 100%;
  position: relative;
  /* padding: 16px; */
}
</style>

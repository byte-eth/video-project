<script setup lang="ts">
import { routeWhiteList } from '@/config/routes'

const { t } = useI18n()
const active = ref(0)
const route = useRoute()

const show = computed(() => route.name && routeWhiteList.includes(route.name))
</script>

<template>
  <div v-if="show" class="app-tabbar-root">
    <van-tabbar
      v-model="active"
      route
      :border="false"
      safe-area-inset-bottom
      class="app-tabbar"
    >
      <van-tabbar-item replace to="/">
        {{ t('menus.home') }}
        <template #icon="props">
          <van-icon
            :name="props.active ? 'wap-home' : 'wap-home-o'"
            class="app-tabbar__icon"
          />
        </template>
      </van-tabbar-item>
      <van-tabbar-item replace to="/my">
        {{ t('menus.my') }}
        <template #icon="props">
          <van-icon
            :name="props.active ? 'contact' : 'contact-o'"
            class="app-tabbar__icon"
          />
        </template>
      </van-tabbar-item>
    </van-tabbar>
    <div class="app-tabbar__spacer" />
  </div>
</template>

<style lang="less" scoped>
.app-tabbar-root {
  --van-tabbar-height: 56px;
}

.app-tabbar {
  --van-tabbar-background: #121214;
  --van-tabbar-item-active-color: #f2a332;
  --van-tabbar-item-active-background: transparent;
  --van-tabbar-item-text-color: #8e8e93;
  --van-tabbar-item-font-size: 11px;
  --van-tabbar-item-line-height: 14px;

  z-index: 99;
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.06);

  :deep(.van-tabbar-item) {
    padding-top: 6px;
    padding-bottom: 4px;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  :deep(.van-tabbar-item__text) {
    margin-top: 4px;
    letter-spacing: 0.02em;
    min-height: 14px;
    line-height: 14px;
    white-space: nowrap;
  }

  :deep(.van-tabbar-item__icon) {
    margin-bottom: 0;
    width: 28px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.app-tabbar__icon {
  display: block;
  font-size: 24px;
  line-height: 1;
  color: #8e8e93;
  transition: color 0.2s ease;
}

.app-tabbar :deep(.van-tabbar-item--active) .app-tabbar__icon {
  color: #f2a332;
}

.app-tabbar__spacer {
  height: calc(var(--van-tabbar-height) + env(safe-area-inset-bottom, 0px));
  min-height: 56px;
}
</style>

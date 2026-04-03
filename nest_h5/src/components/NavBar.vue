<template>
  <van-nav-bar
    class="nav-bar"
    :class="[`nav-bar--${theme}`, { 'nav-bar--transparent': !isBg }]"
    :z-index="999"
    :title="slots.title ? undefined : title"
    left-arrow
    fixed
    :placeholder="placeholder"
    safe-area-inset-top
    :border="false"
    @click-left="isBack && router.back()"
  >
    <template #left>
      <slot name="left">
        <van-icon name="arrow-left" size="20" />
      </slot>
    </template>
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>
    <template #right>
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'
import { useRouter } from 'vue-router'

const slots = useSlots()

withDefaults(
  defineProps<{
    title?: string
    /** 是否显示导航背景（false 时透明，适合压在配图/渐变上） */
    isBg?: boolean
    placeholder?: boolean
    isBack?: boolean
    /** dark：与账户/邀请链路一致；light：浅底页面 */
    theme?: 'dark' | 'light'
  }>(),
  {
    title: '',
    isBg: true,
    placeholder: true,
    isBack: true,
    theme: 'dark',
  },
)

const router = useRouter()
</script>

<style lang="less" scoped>
.nav-bar {
  --van-nav-bar-arrow-size: 20px;

  :deep(.van-nav-bar__title) {
    line-height: 22px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
    max-width: 70vw;
  }

  :deep(.van-nav-bar__left),
  :deep(.van-nav-bar__right) {
    padding: 0 12px;
  }

  :deep(.van-icon-arrow-left) {
    font-weight: 600;
  }
}

.nav-bar--dark {
  --van-nav-bar-background: #121214;
  --van-nav-bar-icon-color: #f2f2f7;
  --van-nav-bar-text-color: #f2f2f7;
  --van-nav-bar-title-text-color: #f2f2f7;

  :deep(.van-nav-bar) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.nav-bar--light {
  --van-nav-bar-background: #ffffff;
  --van-nav-bar-icon-color: #14161a;
  --van-nav-bar-text-color: #14161a;
  --van-nav-bar-title-text-color: #14161a;

  :deep(.van-nav-bar) {
    border-bottom: 1px solid rgba(20, 22, 26, 0.06);
  }
}

.nav-bar--transparent.nav-bar--dark {
  --van-nav-bar-background: transparent !important;

  :deep(.van-nav-bar) {
    border-bottom: none;
  }
}

.nav-bar--transparent.nav-bar--light {
  --van-nav-bar-background: transparent !important;

  :deep(.van-nav-bar) {
    border-bottom: none;
  }
}
</style>

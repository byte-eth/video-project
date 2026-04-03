<script setup lang="ts">
import { routeWhiteList } from '@/config/routes'
import { getMenuImg } from '@/utils/common';

const { t } = useI18n()
const active = ref(0)
const route = useRoute()

const show = computed(() => route.name && routeWhiteList.includes(route.name))
</script>

<template>
  <van-tabbar v-if="show" v-model="active"  route :border="false">
    <van-tabbar-item replace to="/">
      {{ t('menus.wallet') }}
      <template #icon="props">
        <img :src="props.active ? getMenuImg('nav_wallet_act.png') : getMenuImg('nav_wallet_nor.png')" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/my">
      {{ t('menus.my') }}
      <template #icon="props">
        <img :src="props.active ? getMenuImg('nav_my_act.png') : getMenuImg('nav_my_nor.png')" />
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>

<style lang="less" scoped>
.van-tabbar {
  height: 62px;
  background: #1c1c1e;
  z-index: 99;

  .van-tabbar-item {
    color: #808080;
    font-size: 10px;
    line-height: 14px;
    font-weight: 400;
  }

  .van-tabbar-item--active {
    color: #F2A332;
    background: #1c1c1e;
  }

  img {
    width: 24px;
    height: 24px;
  }
}
</style>

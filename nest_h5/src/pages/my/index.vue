<route lang="json5">
  {
    name: 'my',
    meta: {},
  }
</route>
<script setup lang="ts">
import type { PickerColumn } from 'vant'
import { languageColumns, locale } from '@/utils/i18n'

const { t } = useI18n()

const showLanguagePicker = ref(false)
const languageValues = ref<Array<string>>([locale.value])
const language = computed(() => languageColumns.find(l => l.value === locale.value)?.text ?? locale.value)

function onLanguageConfirm(event: { selectedOptions: PickerColumn }) {
  locale.value = event.selectedOptions[0].value as string
  showLanguagePicker.value = false
}
</script>

<template>
  <van-cell-group class="my-page__cells" :border="false" :inset="true">
    <van-cell is-link title="切换语言" :value="language" @click="showLanguagePicker = true" />
  </van-cell-group>
  {{ t('menus.my') }}
  <van-popup v-model:show="showLanguagePicker" position="bottom" class="my-page__popup">
    <van-picker
      v-model="languageValues"
      :columns="languageColumns"
      @confirm="onLanguageConfirm"
      @cancel="showLanguagePicker = false"
    />
  </van-popup>
</template>

<style scoped lang="less">
</style>

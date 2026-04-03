<route lang="json5">
  {
    name: 'my',
    meta: {
      requiresAuth: true,
      i18n: 'menus.my',
    },
  }
</route>

<script setup lang="ts">
import type { PickerColumn } from 'vant'
import { useUserStore } from '@/stores'
import { languageColumns, locale } from '@/utils/i18n'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const showLanguagePicker = ref(false)
const languageValues = ref<Array<string>>([locale.value])
const language = computed(() => languageColumns.find(l => l.value === locale.value)?.text ?? locale.value)

const displayName = computed(
  () => userStore.userInfo.nickname || userStore.userInfo.name || '—',
)

const email = computed(() => userStore.userInfo.email || '')

const isVip = computed(() => !!userStore.userInfo.isVip)

const initials = computed(() => {
  const n = (userStore.userInfo.nickname || userStore.userInfo.name || '?').trim()
  if (!n || n === '—')
    return '?'
  return n.slice(0, 2).toUpperCase()
})

function onLanguageConfirm(event: { selectedOptions: PickerColumn }) {
  locale.value = event.selectedOptions[0].value as string
  showLanguagePicker.value = false
}

async function onLogout() {
  try {
    await showConfirmDialog({
      title: t('auth.logoutConfirmTitle'),
      message: t('auth.logoutConfirmMsg'),
    })
  }
  catch {
    return
  }
  await userStore.logout()
  await router.replace('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c] px-[16px] pb-[32px] pt-[12px]">
    <section
      class="mb-[16px] rounded-[20px] border border-white/[0.07] bg-[#141416] p-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
    >
      <div class="flex items-start gap-[16px]">
        <div
          class="h-[56px] w-[56px] shrink-0 rounded-[16px] bg-gradient-to-br from-[#f2a332] via-[#e89520] to-[#6366f1] text-center text-[18px] font-bold leading-[56px] text-[#1a1206] shadow-[0_8px_20px_rgba(242,163,50,0.25)]"
        >
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1 pt-[2px]">
          <p class="m-0 truncate text-[20px] font-semibold leading-[28px] text-[#f2f2f7]">
            {{ displayName }}
          </p>
          <div class="mt-[10px] flex flex-wrap items-center gap-[8px]">
            <span
              v-if="isVip"
              class="inline-flex items-center rounded-[8px] bg-[#f2a332]/18 px-[10px] py-[4px] text-[12px] font-bold leading-[16px] text-[#f2a332] ring-1 ring-[#f2a332]/35"
            >
              {{ t('auth.vipBadge') }}
            </span>
            <span
              v-else
              class="inline-flex items-center rounded-[8px] bg-white/[0.06] px-[10px] py-[4px] text-[12px] font-medium leading-[16px] text-white/55 ring-1 ring-white/[0.08]"
            >
              {{ t('auth.memberBadge') }}
            </span>
          </div>
          <p class="mt-[6px] text-[12px] leading-[18px] text-white/38">
            {{ isVip ? t('auth.vipHint') : t('auth.memberHint') }}
          </p>
        </div>
      </div>
      <div
        v-if="email"
        class="mt-[20px] border-t border-white/[0.06] pt-[18px]"
      >
        <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
          {{ t('auth.email') }}
        </p>
        <p class="mt-[8px] break-all text-[15px] leading-[22px] text-white/78">
          {{ email }}
        </p>
      </div>
    </section>

    <van-cell-group class="my-cells" :border="false" :inset="true">
      <van-cell
        is-link
        :title="t('auth.switchLang')"
        :value="language"
        @click="showLanguagePicker = true"
      />
      <van-cell
        is-link
        :title="t('auth.logout')"
        class="my-cells__logout"
        @click="onLogout"
      />
    </van-cell-group>
  </div>

  <van-popup v-model:show="showLanguagePicker" position="bottom" class="my-popup">
    <van-picker
      v-model="languageValues"
      :columns="languageColumns"
      @confirm="onLanguageConfirm"
      @cancel="showLanguagePicker = false"
    />
  </van-popup>
</template>

<style scoped lang="less">
/* Vant CellGroup 主题色少量覆盖 */
.my-cells:deep(.van-cell-group--inset) {
  margin: 0 0 16px;
  border-radius: 16px;
  overflow: hidden;
}

.my-cells:deep(.van-cell) {
  background: #161618;
  color: #f2f2f7;
  font-size: 15px;
  padding: 16px 18px;
}

.my-cells:deep(.van-cell__value) {
  color: rgba(255, 255, 255, 0.48);
}

.my-cells__logout:deep(.van-cell__title) {
  color: #f2a332;
  font-weight: 600;
}
</style>

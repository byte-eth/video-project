<route lang="json5">
  {
    name: 'my-invitations',
    meta: {
      requiresAuth: true,
      i18n: 'invite.invitedUsersTitle',
    },
  }
</route>

<script setup lang="ts">
import type { InvitedUserItem } from '@/api/user'
import { getMyInvitationsSummary } from '@/api/user'
import emptyInviteIllus from '@/assets/images/empty-invite.svg'

const { t, locale } = useI18n()

const loading = ref(true)
const total = ref(0)
const items = ref<InvitedUserItem[]>([])

const vipInvitedCount = computed(
  () => items.value.filter(u => u.isVip).length,
)

/** 头像 URL 加载失败时回落到首字母 */
const avatarLoadFailed = reactive<Record<number, boolean>>({})

const AVATAR_GRADIENTS = [
  'bg-[linear-gradient(145deg,#f2a332_0%,#e89520_45%,#6366f1_100%)]',
  'bg-[linear-gradient(145deg,#818cf8_0%,#6366f1_50%,#a855f7_100%)]',
  'bg-[linear-gradient(145deg,#34d399_0%,#059669_55%,#0d9488_100%)]',
  'bg-[linear-gradient(145deg,#fb7185_0%,#e11d48_48%,#c084fc_100%)]',
] as const

function avatarFillClass(id: number) {
  return AVATAR_GRADIENTS[id % 4]!
}

function initials(username: string) {
  const s = username.trim()
  if (!s)
    return '?'
  return s.slice(0, 2).toUpperCase()
}

function rtfLocaleTag() {
  return String(locale.value).toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

function formatRegisteredAt(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime()))
      return iso
    return new Intl.DateTimeFormat(rtfLocaleTag(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }
  catch {
    return iso
  }
}

/** 最近 N 天内用相对时间，与常见「记录流」产品一致 */
function formatListTime(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime()))
      return iso
    const now = Date.now()
    const diffMs = now - d.getTime()
    if (diffMs < 0)
      return formatRegisteredAt(iso)
    const days = Math.floor(diffMs / 86400000)
    if (days >= 14)
      return formatRegisteredAt(iso)
    const rtf = new Intl.RelativeTimeFormat(rtfLocaleTag(), { numeric: 'auto' })
    const sec = Math.floor(diffMs / 1000)
    if (sec < 60)
      return rtf.format(-sec, 'second')
    const min = Math.floor(sec / 60)
    if (min < 60)
      return rtf.format(-min, 'minute')
    const hrs = Math.floor(min / 60)
    if (hrs < 24)
      return rtf.format(-hrs, 'hour')
    return rtf.format(-days, 'day')
  }
  catch {
    return iso
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await getMyInvitationsSummary()
    total.value = data.total
    items.value = data.items
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c] pb-[max(24px,env(safe-area-inset-bottom,0px))]">
    <NavBar :title="t('invite.invitedUsersTitle')" />

    <div class="pt-[24px] pl-[16px] pr-[16px] pb-[24px]">
      <section
        class="relative mb-[16px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(165deg,rgba(28,26,32,0.98)_0%,rgba(16,16,18,1)_55%,rgba(11,11,13,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_56px_rgba(0,0,0,0.38)]"
        :class="loading ? 'opacity-[0.92]' : ''"
        aria-labelledby="inv-head-title"
      >
        <div
          class="pointer-events-none absolute h-[140px] w-[auto] opacity-[0.95] -top-[20%] -left-[10%] -right-[10%] [background:radial-gradient(ellipse_70%_80%_at_18%_0%,rgba(240,168,74,0.22),transparent_60%),radial-gradient(ellipse_55%_60%_at_92%_30%,rgba(99,102,241,0.14),transparent_55%)]"
          aria-hidden="true"
        />
        <div class="relative pt-[20px] pl-[20px] pr-[20px] pb-[16px]">
          <p id="inv-head-title" class="mb-[4px] mt-0 text-[18px] font-bold leading-[24px] tracking-[-0.02em] text-[#f5f5f7]">
            {{ t('invite.invitedUsers') }}
          </p>
          <p class="m-0 text-[13px] leading-[19px] text-white/[0.48]">
            {{ t('invite.totalInvitedLabel', { n: loading ? 0 : total }) }}
          </p>
        </div>

        <div
          class="relative grid grid-cols-2 gap-[10px] pr-[14px] pl-[14px] pb-[16px]"
          role="group"
          :aria-label="t('invite.invitedUsersTitle')"
        >
          <div class="flex flex-col gap-[6px] rounded-[14px] border border-white/[0.07] bg-white/[0.045] pt-[14px] pr-[14px] pb-[12px] pl-[14px]">
            <span class="text-[11px] font-semibold tracking-[0.06em] text-white/[0.38] uppercase">{{ t('invite.statTotal') }}</span>
            <span class="text-[26px] font-bold leading-none tabular-nums tracking-[-0.03em] text-[#f2f2f7]">{{ loading ? '—' : total }}</span>
          </div>
          <div class="flex flex-col gap-[6px] rounded-[14px] border border-[rgba(240,168,74,0.18)] bg-[rgba(240,168,74,0.07)] pt-[14px] pr-[14px] pb-[12px] pl-[14px]">
            <span class="text-[11px] font-semibold tracking-[0.06em] text-white/[0.38] uppercase">{{ t('invite.statVip') }}</span>
            <span class="text-[26px] font-bold leading-none tabular-nums tracking-[-0.03em] bg-[linear-gradient(135deg,#fce4b8_0%,#f0a84a_45%,#d98718_100%)] bg-clip-text text-transparent">{{ loading ? '—' : vipInvitedCount }}</span>
          </div>
        </div>
      </section>

      <van-loading
        v-if="loading"
        class="flex justify-center pt-[40px] pr-0 pb-[28px] pl-0"
        color="#f0a028"
        size="32px"
      />

      <template v-else>
        <div
          v-if="items.length === 0"
          class="mt-[4px] rounded-[18px] border border-dashed border-white/[0.12] bg-white/[0.025] pt-[28px] pr-[20px] pb-[32px] pl-[20px] text-center"
        >
          <div class="mx-auto mb-[12px] flex max-w-[200px] items-center justify-center" aria-hidden="true">
            <img
              :src="emptyInviteIllus"
              alt=""
              class="block h-auto w-[min(200px,72vw)] opacity-[0.95] [filter:drop-shadow(0_12px_28px_rgba(0,0,0,0.35))]"
              width="200"
              height="160"
              decoding="async"
            >
          </div>
          <p class="mb-[8px] mt-0 text-[16px] font-semibold leading-[22px] text-white/[0.78]">
            {{ t('invite.empty') }}
          </p>
          <p class="mx-auto my-0 max-w-[280px] text-[13px] leading-[20px] text-white/[0.38]">
            {{ t('invite.emptyHint') }}
          </p>
        </div>

        <template v-else>
          <header class="mb-[8px] pt-[2px] pr-[2px] pb-0 pl-[2px]">
            <div class="flex items-center gap-[10px]">
              <h2 class="m-0 select-none text-[15px] font-bold leading-[22px] tracking-[-0.01em] text-[#ececf1]">
                {{ t('invite.listSectionTitle') }}
              </h2>
              <span class="min-w-[22px] rounded-full border border-white/[0.1] bg-white/[0.08] px-[8px] py-[2px] text-center text-[11px] font-bold leading-[18px] text-white/[0.85] tabular-nums">{{ items.length }}</span>
            </div>
            <p class="mb-0 mt-[4px] text-[11px] leading-[15px] text-white/[0.32]">
              {{ t('invite.sortNewest') }}
            </p>
          </header>

          <ul
            class="m-0 list-none overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-0 shadow-[0_18px_44px_rgba(0,0,0,0.28)]"
            role="list"
          >
            <li
              v-for="(row, index) in items"
              :key="row.id"
              class="relative box-border flex min-h-[56px] items-center gap-[10px] py-[10px] pr-[12px] pb-[10px] pl-[12px]"
            >
              <div
                class="h-[40px] w-[40px] shrink-0 rounded-full text-[13px] font-bold leading-none tracking-[0.02em] text-[#14110a] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center"
                :class="
                  row.avatar && !avatarLoadFailed[row.id]
                    ? 'overflow-hidden bg-[#1a1a1c] p-0'
                    : avatarFillClass(row.id)
                "
              >
                <img
                  v-if="row.avatar && !avatarLoadFailed[row.id]"
                  :src="row.avatar"
                  alt=""
                  class="block h-full w-full object-cover"
                  @error="avatarLoadFailed[row.id] = true"
                >
                <span
                  v-if="!row.avatar || avatarLoadFailed[row.id]"
                  class="flex h-full w-full items-center justify-center"
                >{{ initials(row.username) }}</span>
              </div>

              <div class="min-w-0 flex flex-1 flex-col gap-[3px]">
                <div class="flex items-center justify-between gap-[8px]">
                  <span class="min-w-0 flex-1 overflow-hidden text-[15px] font-semibold leading-[20px] tracking-[-0.01em] text-ellipsis text-nowrap text-[#f2f2f7]">{{ row.username }}</span>
                  <time class="max-w-[46%] shrink-0 overflow-hidden text-right text-[11px] font-medium leading-[16px] text-ellipsis text-nowrap text-white/[0.36]" :datetime="row.createdAt">{{ formatListTime(row.createdAt) }}</time>
                </div>
                <div class="flex min-w-0 items-center gap-[6px]">
                  <span
                    class="shrink-0 inline-flex items-center rounded-full py-[1px] pr-[7px] pl-[7px] text-[9px] font-bold tracking-[0.04em] uppercase"
                    :class="row.isVip
                      ? 'text-[#f0a84a] bg-[rgba(240,168,74,0.14)] shadow-[0_0_0_1px_rgba(240,168,74,0.26)]'
                      : 'text-white/[0.55] bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'"
                  >{{ row.isVip ? t('auth.vipBadge') : t('auth.memberBadge') }}</span>
                  <span class="flex min-w-0 flex-1 items-center gap-[4px] overflow-hidden text-[12px] leading-[16px] text-white/[0.42]" :title="`${t('invite.userId')} ${row.id} · ${row.email}`">
                    <span class="shrink-0 text-[10px] font-semibold text-white/[0.32] [font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace]">#{{ row.id }}</span>
                    <span class="shrink-0 text-white/[0.22]" aria-hidden="true">·</span>
                    <span class="min-w-0 flex-1 overflow-hidden text-ellipsis text-nowrap">{{ row.email }}</span>
                  </span>
                </div>
              </div>

              <div
                v-if="index < items.length - 1"
                class="pointer-events-none absolute right-[12px] bottom-0 left-[62px] h-[1px] [background:linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]"
                aria-hidden="true"
              />
            </li>
          </ul>
        </template>
      </template>
    </div>
  </div>
</template>

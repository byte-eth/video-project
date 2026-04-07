<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import createQr from 'qrcode-generator'
import { showSuccessToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores'

/** 二维码白色区域内边距后的有效边长（px），与外层 h/w、p-[9px] 一致 */
const QR_INNER_PX = 122

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const qrcodeRef = ref<HTMLElement | null>(null)

const isOverlayVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const shareUrl = computed(() => {
  const origin = window.location.origin
  const inviteCode = userInfo.value?.inviteCode ?? ''
  const url = new URL('/', origin)
  if (inviteCode)
    url.searchParams.set('inviteCode', inviteCode)
  return url.toString()
})

const displayCode = computed(() => userInfo.value?.inviteCode?.trim() || '')

watch(isOverlayVisible, async (val) => {
  if (!val)
    return
  await nextTick()
  try {
    generateQRCode()
  }
  catch {
    /* ignore */
  }
})

function generateQRCode() {
  if (!qrcodeRef.value)
    return

  const qr = createQr(0, 'L')
  qr.addData(shareUrl.value)
  qr.make()
  const svgTag = (qr as { createSvgTag(o: Record<string, unknown>): string }).createSvgTag({
    cellColor: '#0a0a0c',
    margin: 3,
    cellScale: QR_INNER_PX / qr.getModuleCount(),
  })
  const svgWithStyle = svgTag.replace(
    '<svg',
    '<svg style="display:block;width:100%;height:100%;border-radius:12px;overflow:hidden"',
  )
  qrcodeRef.value.innerHTML = svgWithStyle
}

function copyText(text: string | undefined | null) {
  if (!text)
    return

  const done = () => showSuccessToast({ message: t('invite.copied') })

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {})
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    if (document.execCommand('copy'))
      done()
  }
  catch {
    /* ignore */
  }
  finally {
    document.body.removeChild(textarea)
  }
}

function closeOverlay() {
  isOverlayVisible.value = false
}

function goInvitations() {
  closeOverlay()
  router.push('/my/invitations')
}

/** 遮罩毛玻璃：半透明底 + blur + saturate（Safari 需 Webkit 前缀） */
const overlayShellStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  // 略浅、略透，才能把背后内容「糊」出来
  background: 'rgba(10, 10, 14, 0.48)',
  backdropFilter: 'blur(20px) saturate(170%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
  '--van-overlay-background': 'rgba(10, 10, 14, 0.48)',
} as Record<string, string>
</script>

<template>
  <van-overlay
    v-model:show="isOverlayVisible"
    teleport="body"
    :z-index="3000"
    :custom-style="overlayShellStyle"
  >
    <div
      class="box-border flex min-h-[100vh] w-full max-w-[100vw] items-end justify-center px-0"
      @click.self="closeOverlay"
    >
      <div
        class="share-panel-enter share-sheet box-border w-full max-w-[480px] rounded-t-[20px] border-[1px] border-b-0 border-solid border-[rgba(255,255,255,0.07)] bg-[#121214] px-[16px] pt-[10px] pb-[max(20px,env(safe-area-inset-bottom,0px))] shadow-[0_-12px_40px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-modal="true"
        :aria-label="t('invite.shareTitle')"
      >
        <div
          class="mx-auto mb-[10px] h-[3px] w-[36px] shrink-0 rounded-full bg-[rgba(255,255,255,0.14)]"
          aria-hidden="true"
        />

        <h2
          class="mb-[4px] text-center text-[17px] font-semibold leading-[24px] tracking-[-0.01em] text-[#f2f2f7]"
        >
          {{ t('invite.shareTitle') }}
        </h2>
        <p
          class="mx-auto mb-[14px] max-w-[300px] text-center text-[12px] leading-[17px] text-[rgba(255,255,255,0.44)]"
        >
          {{ t('invite.shareSubtitle') }}
        </p>

        <!-- 二维码 -->
        <div
          class="relative mb-[12px] flex min-h-[196px] flex-col items-center justify-center overflow-hidden rounded-[14px] border-[1px] border-solid bg-gradient-to-b from-[#1f1d22] via-[#16151a] to-[#0e0e11] py-[18px] px-[14px]"
        >
          <div
            class="pointer-events-none absolute left-[-20%] top-[-35%] aspect-square w-[65%] rounded-full bg-[rgba(242,163,50,0.18)] blur-[40px]"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute bottom-[-30%] right-[-18%] aspect-square w-[55%] rounded-full bg-[rgba(129,140,248,0.14)] blur-[36px]"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute left-1/2 top-[28%] h-[72px] w-[min(220px,88%)] -translate-x-1/2 rounded-full bg-[rgba(242,163,50,0.06)] blur-[26px]"
            aria-hidden="true"
          />

          <p
            class="relative z-[1] mb-[12px] max-w-[260px] text-center text-[11px] leading-[15px] text-[rgba(255,255,255,0.45)]"
          >
            {{ t('invite.scanToJoin') }}
          </p>
          <div
            class="relative z-[1] box-border h-[140px] w-[140px] shrink-0 rounded-[12px] bg-[#fafafa] p-[9px] shadow-[0_10px_28px_rgba(0,0,0,0.32)] ring-1 ring-black/5"
          >
            <div ref="qrcodeRef" class="h-full w-full" />
          </div>
        </div>

        <!-- 邀请码 + 链接 -->
        <div
          class="mb-[24px] overflow-hidden rounded-[12px] border-[1px] border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)]"
        >
          <div class="flex items-center gap-[10px] px-[12px] py-[10px]">
            <div class="min-w-0 flex-1">
              <div class="mb-[2px] text-[11px] font-medium leading-[14px] text-[rgba(255,255,255,0.42)]">
                {{ t('invite.myInviteCode') }}
              </div>
              <p
                class="truncate text-[15px] font-semibold leading-[20px] tracking-[0.04em] text-[#f0a84a] tabular-nums"
              >
                {{ displayCode || t('invite.noCodeYet') }}
              </p>
            </div>
            <button
              type="button"
              class="share-sheet__btn share-sheet__btn--muted shrink-0 self-center"
              :disabled="!displayCode"
              @click="copyText(displayCode)"
            >
              {{ t('invite.copyCode') }}
            </button>
          </div>
          <div class="mx-[12px] h-px shrink-0 bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
          <div class="flex items-center gap-[10px] px-[12px] py-[10px]">
            <div class="min-w-0 flex-1">
              <div class="mb-[2px] text-[11px] font-medium leading-[14px] text-[rgba(255,255,255,0.42)]">
                {{ t('invite.shareLink') }}
              </div>
              <p
                class="truncate font-mono text-[11px] leading-[15px] text-[rgba(255,255,255,0.55)]"
                :title="shareUrl"
              >
                {{ shareUrl }}
              </p>
            </div>
            <button
              type="button"
              class="share-sheet__btn share-sheet__btn--accent shrink-0 self-center"
              @click="copyText(shareUrl)"
            >
              {{ t('invite.copyLink') }}
            </button>
          </div>
        </div>

        <div class="flex gap-[10px]">
          <button
            type="button"
            class="share-sheet__btn-main share-sheet__btn-main--secondary h-[46px] flex-1"
            @click="goInvitations"
          >
            {{ t('invite.viewRecords') }}
          </button>
          <button
            type="button"
            class="share-sheet__btn-main share-sheet__btn-main--primary h-[46px] flex-1"
            @click="copyText(shareUrl)"
          >
            {{ t('invite.quickCopyLink') }}
          </button>
        </div>
      </div>
    </div>
  </van-overlay>
</template>

<style scoped>
/* 仅保留入场动画；其余用 Uno 任意值 */
@keyframes share-panel-up {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.share-panel-enter {
  animation: share-panel-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* 弹层内按钮：统一圆角、字重与主色渐变，避免各处 Uno 微差 */
.share-sheet__btn {
  box-sizing: border-box;
  min-height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.share-sheet__btn:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.share-sheet__btn--muted {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.share-sheet__btn--muted:active:not(:disabled) {
  opacity: 0.86;
}

.share-sheet__btn--accent {
  background: linear-gradient(145deg, #b56f10 0%, #d88414 45%, #f0a028 100%);
  color: #14110a;
}

.share-sheet__btn--accent:active {
  opacity: 0.9;
}

.share-sheet__btn-main {
  box-sizing: border-box;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 46px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.share-sheet__btn-main--secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.share-sheet__btn-main--secondary:active {
  opacity: 0.88;
}

.share-sheet__btn-main--primary {
  background: linear-gradient(145deg, #a8620e 0%, #cb7a12 35%, #f0a028 65%, #f2c15a 100%);
  color: #14110a;
  box-shadow: 0 4px 18px rgba(242, 163, 50, 0.22);
}

.share-sheet__btn-main--primary:active {
  opacity: 0.92;
}
</style>

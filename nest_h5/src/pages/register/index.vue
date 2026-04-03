<route lang="json5">
  {
    name: 'register',
    meta: {
      i18n: 'auth.registerTitle',
    },
  }
</route>

<script setup lang="ts">
import type { RegisterData } from '@/api/user'
import { useUserStore } from '@/stores'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive<RegisterData & { confirm: string }>({
  email: '',
  username: '',
  password: '',
  confirm: '',
  inviteCode: localStorage.getItem('inviteCode') || '',
})

async function onSubmit() {
  if (!form.email.trim() || !form.username.trim() || !form.password) {
    showToast(t('auth.fillAll'))
    return
  }
  if (form.password.length < 8) {
    showToast(t('auth.passwordMin'))
    return
  }
  if (form.password !== form.confirm) {
    showToast(t('auth.passwordMismatch'))
    return
  }
  loading.value = true
  try {
    await userStore.register({
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
      inviteCode: form.inviteCode?.trim() || undefined,
    })
    showSuccessToast(t('auth.registerOk'))
    await router.replace('/login')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#08080a] text-[#f2f2f7]"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-20%,rgba(242,163,50,0.2),transparent_55%)]"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_0%_55%,rgba(129,140,248,0.1),transparent_50%)]"
    />

    <div
      class="relative z-[1] mx-auto flex w-full max-w-[440px] flex-1 flex-col px-[16px] pb-[max(4vh,env(safe-area-inset-bottom,0px))] pt-[max(4vh,env(safe-area-inset-top,0px))]"
    >
      <header class="mb-[6vh]">
        <h1
          class="m-0 bg-gradient-to-br from-[#f2a332] via-[#ffc56d] to-[#fff8e8] bg-clip-text text-[26px] font-bold leading-[32px] tracking-[0.02em] text-transparent"
        >
          {{ t('auth.registerTitle') }}
        </h1>
        <p class="mt-[4px] text-[13px] leading-[19px] text-[rgba(255,255,255,0.46)]">
          {{ t('auth.registerSubtitle') }}
        </p>
      </header>

      <div
        class="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,20,0.94)] shadow-[0px_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-[12px]"
      >
        <div class="border-b border-[rgba(255,255,255,0.06)] px-[16px] py-[12px]">
          <p class="m-0 text-[16px] font-semibold leading-[22px] text-[#f2f2f7]">
            {{ t('auth.register') }}
          </p>
          <p class="mt-[2px] text-[11px] leading-[15px] text-[rgba(255,255,255,0.36)]">
            {{ t('auth.formSecureHint') }}
          </p>
        </div>

        <van-form class="px-[16px] pb-[16px] pt-[14px]" @submit="onSubmit">
          <div class="mb-[12px]">
            <span
              class="mb-[5px] block text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.52)]"
            >{{ t('auth.email') }}</span>
            <div class="auth-input-shell">
              <van-field
                v-model="form.email"
                name="email"
                type="email"
                :border="false"
                autocomplete="email"
                :placeholder="t('auth.email')"
                class="auth-van-field"
                :rules="[{ required: true, message: t('auth.emailRequired') }]"
              />
            </div>
          </div>

          <div class="mb-[12px]">
            <span
              class="mb-[5px] block text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.52)]"
            >{{ t('auth.username') }}</span>
            <div class="auth-input-shell">
              <van-field
                v-model="form.username"
                name="username"
                :border="false"
                autocomplete="username"
                :placeholder="t('auth.username')"
                class="auth-van-field"
                :rules="[{ required: true, message: t('auth.usernameRequired') }]"
              />
            </div>
          </div>

          <div class="mb-[12px]">
            <span
              class="mb-[5px] block text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.52)]"
            >{{ t('auth.inviteCode') }}</span>
            <div class="auth-input-shell">
              <van-field
                v-model="form.inviteCode"
                name="inviteCode"
                :border="false"
                autocomplete="off"
                :placeholder="t('auth.inviteCode')"
                class="auth-van-field"
              />
            </div>
          </div>

          <div class="mb-[12px]">
            <span
              class="mb-[5px] block text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.52)]"
            >{{ t('auth.password') }}</span>
            <div class="auth-input-shell">
              <van-field
                v-model="form.password"
                type="password"
                name="password"
                :border="false"
                autocomplete="new-password"
                :placeholder="t('auth.password')"
                class="auth-van-field"
                :rules="[{ required: true, message: t('auth.passwordRequired') }]"
              />
            </div>
            <p
              class="mt-[5px] px-[2px] text-[11px] leading-[15px] text-[rgba(255,255,255,0.34)]"
            >
              {{ t('auth.passwordMin') }}
            </p>
          </div>

          <div>
            <span
              class="mb-[5px] block text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.52)]"
            >{{ t('auth.confirmPassword') }}</span>
            <div class="auth-input-shell">
              <van-field
                v-model="form.confirm"
                type="password"
                name="confirm"
                :border="false"
                autocomplete="new-password"
                :placeholder="t('auth.confirmPassword')"
                class="auth-van-field"
              />
            </div>
          </div>

          <div class="pt-[26px]">
            <van-button
              round
              block
              native-type="submit"
              :loading="loading"
              class="auth-submit"
            >
              {{ t('auth.register') }}
            </van-button>
          </div>
        </van-form>
      </div>

      <footer
        class="mt-auto shrink-0 pt-[24px] text-center text-[13px] leading-[20px] text-[rgba(255,255,255,0.42)]"
      >
        {{ t('auth.hasAccount') }}
        <router-link
          to="/login"
          class="ml-[4px] font-semibold text-[#f2a332] no-underline active:opacity-[0.8]"
        >
          {{ t('auth.goLogin') }}
        </router-link>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="less">
.auth-input-shell {
  position: relative;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1c1c21;
  transition: border-color 0.2s ease;
}

.auth-input-shell:focus-within {
  border-color: rgba(242, 163, 50, 0.55);
}

.auth-input-shell:focus-within::after {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: 1;
  border-radius: 12px;
  border: 2px solid rgba(242, 163, 50, 0.35);
  pointer-events: none;
}

.auth-van-field:deep(.van-cell) {
  position: relative;
  z-index: 2;
  overflow: visible;
  border-radius: 9px;
  padding: 12px 14px;
  background: transparent;
}

.auth-van-field:deep(.van-field__control) {
  font-size: 15px;
  line-height: 22px;
  color: #f2f2f7;
}

.auth-van-field:deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.28);
}

.auth-van-field:deep(.van-field__error-message) {
  padding: 4px 0 0;
  margin: 0;
  font-size: 11px;
  line-height: 15px;
}

.auth-submit.van-button {
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border: none;
  color: #1a1206;
  background: linear-gradient(135deg, #c27816 0%, #f0a028 45%, #f5c56a 100%);
  box-shadow: 0 8px 22px rgba(242, 163, 50, 0.22);
}

.auth-submit.van-button:active:not(.van-button--loading) {
  transform: translateY(1px);
  box-shadow: 0 4px 14px rgba(242, 163, 50, 0.18);
}

.auth-submit.van-button--loading {
  opacity: 0.88;
}
</style>

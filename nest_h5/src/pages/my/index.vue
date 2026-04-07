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
import { showFailToast, showLoadingToast, showSuccessToast } from 'vant'
import GlobalShareOverlay from '@/components/GlobalShareOverlay.vue'
import { getMyInvitationsSummary, getQiniuUploadToken, updateUserProfile } from '@/api/user'
import { useUserStore } from '@/stores'
import { languageColumns, locale } from '@/utils/i18n'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const showShareOverlay = ref(false)
const inviteTotal = ref<number | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const profileSaving = ref(false)
const showProfilePopup = ref(false)
const profileFormUsername = ref('')
const profileFormAvatar = ref('')
const profileFormAvatarPreview = ref('')

const showLanguagePicker = ref(false)
const languageValues = ref<Array<string>>([locale.value])
const language = computed(() => languageColumns.find(l => l.value === locale.value)?.text ?? locale.value)

const displayName = computed(
  () => userStore.userInfo.nickname || userStore.userInfo.name || '—',
)

const email = computed(() => userStore.userInfo.email || '')

const isVip = computed(() => !!userStore.userInfo.isVip)

const avatarUrl = computed(() => (userStore.userInfo.avatar || '').trim())
const popupAvatarUrl = computed(() => profileFormAvatarPreview.value || profileFormAvatar.value || avatarUrl.value)

function resetAvatarPreview() {
  if (profileFormAvatarPreview.value.startsWith('blob:'))
    URL.revokeObjectURL(profileFormAvatarPreview.value)
  profileFormAvatarPreview.value = ''
}

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

function openProfilePopup() {
  if (avatarUploading.value || profileSaving.value)
    return
  profileFormUsername.value = (userStore.userInfo.nickname || userStore.userInfo.name || '').trim()
  profileFormAvatar.value = (userStore.userInfo.avatar || '').trim()
  resetAvatarPreview()
  showProfilePopup.value = true
}

async function onSaveProfileFromPopup() {
  if (profileSaving.value || avatarUploading.value)
    return
  const username = profileFormUsername.value.trim()
  if (username.length < 2 || username.length > 12) {
    showFailToast(t('auth.profileUsernameLengthHint'))
    return
  }
  profileSaving.value = true
  const toast = showLoadingToast({ duration: 0, message: t('auth.profileSaving'), forbidClick: true })
  try {
    const profile = await updateUserProfile({
      username,
      avatar: profileFormAvatar.value || undefined,
    })
    userStore.setInfo({
      nickname: profile.username,
      name: profile.username,
      avatar: profile.avatar ?? '',
    })
    showSuccessToast(t('auth.profileSaved'))
    showProfilePopup.value = false
  }
  catch (error) {
    showFailToast(error instanceof Error ? error.message : t('auth.profileSaveFailed'))
  }
  finally {
    profileSaving.value = false
    toast.close()
  }
}

function openAvatarPicker() {
  if (avatarUploading.value || profileSaving.value)
    return
  avatarInputRef.value?.click()
}

async function onAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file)
    return

  avatarUploading.value = true
  const toast = showLoadingToast({ duration: 0, message: t('auth.profileUploadingAvatar'), forbidClick: true })
  try {
    const token = await getQiniuUploadToken({
      directory: 'avatar',
      fileName: file.name,
    })
    const formData = new FormData()
    formData.append('token', token.uploadToken)
    formData.append('key', token.key)
    formData.append('file', file)

    const uploadHost = token.uploadHost || 'https://up.qiniup.com'
    const uploadRes = await fetch(uploadHost, {
      method: 'POST',
      body: formData,
    })
    if (!uploadRes.ok) {
      throw new Error(`upload failed: ${uploadRes.status}`)
    }
    const uploadData = await uploadRes.json() as { key?: string }
    const finalKey = uploadData.key || token.key
    profileFormAvatar.value = finalKey
    resetAvatarPreview()
    profileFormAvatarPreview.value = URL.createObjectURL(file)
    showSuccessToast(t('auth.profileAvatarUploaded'))
  }
  catch (error) {
    showFailToast(error instanceof Error ? error.message : t('auth.profileAvatarUploadFailed'))
  }
  finally {
    avatarUploading.value = false
    toast.close()
  }
}

onBeforeUnmount(() => {
  resetAvatarPreview()
})

const inviteCountLabel = computed(() => {
  if (inviteTotal.value == null)
    return ''
  return t('invite.peopleCount', { n: inviteTotal.value })
})

async function openInviteShare() {
  if (!userStore.userInfo?.inviteCode) {
    try {
      await userStore.info()
    }
    catch {
      /* 仍尝试打开弹层，链接里可无 inviteCode */
    }
  }
  showShareOverlay.value = true
}

onMounted(async () => {
  try {
    const data = await getMyInvitationsSummary()
    inviteTotal.value = data.total
  }
  catch {
    inviteTotal.value = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c] px-[16px] pb-[32px] pt-[12px]">
    <section
      class="mb-[16px] rounded-[20px] border border-white/[0.07] bg-[#141416] p-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
    >
      <div class="flex items-center gap-[16px]">
        <div
          class="h-[56px] w-[56px] overflow-hidden rounded-[16px]"
          :class="{ 'opacity-75': avatarUploading }"
          @click="openProfilePopup"
        >
          <img v-if="avatarUrl" :src="avatarUrl" class="block h-[56px] w-[56px] object-cover" alt="avatar">
          <img v-else src="@/assets/images/common/default_avatar.png" class="block h-[56px] w-[56px] object-cover" alt="avatar">
        </div>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onAvatarFileChange"
        >
        <div class="min-w-0 flex-1 flex flex-col gap-8px">
          <p
            class="m-0 cursor-pointer truncate text-[20px] font-semibold leading-[20px] text-[#f2f2f7]"
            @click="openProfilePopup"
          >
            {{ displayName }}
          </p>
          <div class="flex flex-wrap items-center gap-[8px]">
            <span
              v-if="isVip"
              class="inline-flex items-center rounded-[8px] bg-[#f2a332]/18 px-[6px] py-[2px] text-[12px] font-bold leading-[16px] text-[#f2a332] ring-1 ring-[#f2a332]/35"
            >
              {{ t('auth.vipBadge') }}
            </span>
            <span
              v-else
              class="inline-flex items-center rounded-[8px] bg-white/[0.06] px-[6px] py-[2px] text-[12px] font-medium leading-[16px] text-white/55 ring-1 ring-white/[0.08]"
            >
              {{ t('auth.memberBadge') }}
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="email"
        class="border-t border-white/[0.06] pt-[20px]"
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
        clickable
        :title="t('invite.inviteFriends')"
        @click="openInviteShare"
      />
      <van-cell
        is-link
        :title="t('invite.invitedUsers')"
        :value="inviteCountLabel"
        @click="router.push('/my/invitations')"
      />
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

  <GlobalShareOverlay v-model="showShareOverlay" />

  <van-popup
    v-model:show="showProfilePopup"
    round
    position="bottom"
    class="bg-[#111114] rounded-tl-[22px] rounded-tr-[22px]"
  >
    <div class="px-[16px] pt-[10px] pb-24px">
      <div class="mx-auto mb-[18px] h-[4px] w-[42px] rounded-[999px] bg-white/14" />
      <div class="mb-[24px]">
        <span class="block text-[18px] font-[700] leading-[25px] text-[#f2f2f7]">{{ t('auth.profileEditTitle') }}</span>
        <p class="mt-[6px] text-[12px] leading-[18px] text-white/48">
          {{ t('auth.profileEditSubtitle') }}
        </p>
      </div>
      <div
        class="rounded-[14px] px-[8px] mb-20px"
      >
        <p class="mb-[10px] text-[12px] font-[600] leading-[16px] text-white/70">
          {{ t('auth.profileUploadAvatar') }}
        </p>
        <div class="flex items-center justify-between gap-[14px]">
          <div
            class="h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[16px]"
            :class="{ 'opacity-75': avatarUploading }"
            @click="openAvatarPicker"
          >
            <img v-if="popupAvatarUrl" :src="popupAvatarUrl" class="h-[58px] w-[58px] block object-cover" alt="avatar">
            <img v-else src="@/assets/images/common/default_avatar.png" class="h-[58px] w-[58px] block object-cover" alt="avatar">
          </div>
          <div class="min-w-0 flex-1 flex flex-col gap-[4px]">
            <p class="truncate text-[13px] font-[600] leading-[18px] text-white/70">
              文件格式:
            </p>
            <p class="text-[12px] leading-[16px] text-white/48">
              PNG / JPG / WEBP
            </p>
          </div>
          <van-button
            size="small"
            class="h-[34px] min-w-[90px] border !border-[#f2a332] bg-transparent px-[12px] text-[12px] font-[600] !text-[#f2a332]"
            :loading="avatarUploading"
            :disabled="profileSaving"
            @click="openAvatarPicker"
          >
            {{ t('auth.profileUploadAvatar') }}
          </van-button>
        </div>
      </div>
      <div class="rounded-[16px] border border-white/8 bg-[#1a1b1f] px-[8px] mb-24px">
        <p class="mb-[10px] text-[12px] font-[600] leading-[18px] text-white/70">
          {{ t('auth.username') }}
        </p>
        <div class="my-profile-popup__field-wrap">
          <van-field
            v-model="profileFormUsername"
            :placeholder="t('auth.profileUsernamePlaceholder')"
            maxlength="12"
            clearable
          />
        </div>
        <p class="mt-[12px] px-[2px] text-[11px] leading-[15px] text-white/36">
          {{ t('auth.profileUsernameLengthHint') }}
        </p>
      </div>
      <van-button
        block
        class="my-profile-popup__save-btn mt-[30px]"
        :loading="profileSaving"
        :disabled="avatarUploading"
        @click="onSaveProfileFromPopup"
      >
        {{ t('auth.save') }}
      </van-button>
    </div>
  </van-popup>

  <van-popup v-model:show="showLanguagePicker" position="bottom">
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

.my-profile-popup__field-wrap:deep(.van-cell) {
  position: relative;
  z-index: 2;
  overflow: visible;
  border-radius: 9px;
  background: transparent;
  padding: 6px 12px;
}

.my-profile-popup__field-wrap:deep(.van-field__body) {
  column-gap: 8px;
}

.my-profile-popup__field-wrap:deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.28);
}

.my-profile-popup__field-wrap:deep(.van-field__control) {
  font-size: 16px;
  line-height: 24px;
  color: #f2f2f7;
}

.my-profile-popup__field-wrap {
  position: relative;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1c1c21;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.my-profile-popup__field-wrap:focus-within::after {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: 1;
  border-radius: 12px;
  border: 2px solid rgba(242, 163, 50, 0.35);
  pointer-events: none;
}

.my-profile-popup__save-btn.van-button {
  height: 46px;
  border: none;
  border-radius: 12px;
  color: #1a1206;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.03em;
  background: linear-gradient(135deg, #c27816 0%, #f0a028 45%, #f5c56a 100%);
  box-shadow: 0 8px 22px rgba(242, 163, 50, 0.22);
}

.my-profile-popup__save-btn.van-button:active:not(.van-button--loading) {
  transform: translateY(1px);
  box-shadow: 0 4px 14px rgba(242, 163, 50, 0.18);
}
</style>

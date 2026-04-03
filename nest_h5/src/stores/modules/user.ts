import { defineStore } from 'pinia'
import type { LoginData, RegisterData, UserState } from '@/api/user'
import { clearToken, getRefreshToken, setRefreshToken, setToken } from '@/utils/auth'

import {
  getUserInfo,
  login as userLogin,
  logout as apiLogout,
  register as userRegister,
} from '@/api/user'

const InitUserInfo: UserState = {
  uid: 0,
  nickname: '',
  name: '',
  avatar: '',
  email: '',
  isVip: false,
  inviteCode: '',
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserState>({ ...InitUserInfo })

  const setInfo = (partial: Partial<UserState>) => {
    userInfo.value = { ...userInfo.value, ...partial }
  }

  const login = async (loginForm: LoginData) => {
    try {
      const data = await userLogin(loginForm)
      setToken(data.access_token)
      setRefreshToken(data.refresh_token)
      const profile = await getUserInfo()
      setInfo({
        uid: profile.id,
        nickname: profile.username,
        name: profile.username,
        avatar: profile.avatar ?? '',
        email: profile.email,
        isVip: profile.isVip,
        inviteCode: profile.inviteCode,
      })
    }
    catch (error) {
      clearToken()
      throw error
    }
  }

  const info = async () => {
    try {
      const data = await getUserInfo()
      setInfo({
        uid: data.id,
        nickname: data.username,
        name: data.username,
        avatar: data.avatar ?? '',
        email: data.email,
        isVip: data.isVip,
        inviteCode: data.inviteCode,
      })
    }
    catch (error) {
      clearToken()
      throw error
    }
  }

  const logout = async () => {
    const rt = getRefreshToken()
    try {
      if (rt)
        await apiLogout(rt)
    }
    finally {
      clearToken()
      setInfo({ ...InitUserInfo })
    }
  }

  const register = async (data: RegisterData) => {
    return userRegister(data)
  }

  return {
    userInfo,
    info,
    login,
    logout,
    register,
    setInfo,
  }
}, {
  persist: true,
})

export default useUserStore

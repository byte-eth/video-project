import { STORAGE_REFRESH_TOKEN_KEY, STORAGE_TOKEN_KEY } from '@/stores/mutation-type'
import { useLocalStorage } from '@vueuse/core'

const token = useLocalStorage(STORAGE_TOKEN_KEY, '')
const refreshToken = useLocalStorage(STORAGE_REFRESH_TOKEN_KEY, '')

function isLogin() {
  return !!token.value
}

function getToken() {
  return token.value
}

function getRefreshToken() {
  return refreshToken.value
}

function setToken(newToken: string) {
  token.value = newToken
}

function setRefreshToken(newToken: string) {
  refreshToken.value = newToken
}

function clearToken() {
  token.value = ''
  refreshToken.value = ''
}

export {
  clearToken,
  getRefreshToken,
  getToken,
  isLogin,
  setRefreshToken,
  setToken,
}

import { createRouter, createWebHistory } from 'vue-router/auto'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

import type { EnhancedRouteLocation } from './types'
import useRouteCacheStore from '@/stores/modules/routeCache'
import { useUserStore } from '@/stores'

import { isLogin } from '@/utils/auth'
import { i18n } from '@/utils/i18n'
import setPageTitle from '@/utils/set-page-title'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_PUBLIC_PATH),
  routes,
})

// This will update routes at runtime without reloading the page
if (import.meta.hot)
  handleHotUpdate(router)

function resolveTitle(meta: EnhancedRouteLocation['meta']) {
  if (meta.i18n && typeof meta.i18n === 'string')
    return i18n.global.t(meta.i18n) as string
  return meta.title
}

router.beforeEach(async (to: EnhancedRouteLocation) => {
  const routeCacheStore = useRouteCacheStore()
  const userStore = useUserStore()

  // 全局首次进入时，如果 URL 中携带邀请码，则持久化到本地
  const rawInvite = to.query?.inviteCode
  if (typeof rawInvite === 'string' && rawInvite && !localStorage.getItem('inviteCode')) {
    localStorage.setItem('inviteCode', rawInvite)
  }

  routeCacheStore.addRoute(to)

  setPageTitle(resolveTitle(to.meta))

  if (to.meta.requiresAuth && !isLogin()) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if ((to.name === 'login' || to.name === 'register') && isLogin()) {
    const redir = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    if (redir.startsWith('/') && !redir.startsWith('//'))
      return { path: redir }
    return { path: '/' }
  }

  if (isLogin() && !userStore.userInfo?.uid)
    await userStore.info()
})

router.afterEach(() => {
})

export default router

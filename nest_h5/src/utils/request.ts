import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios, { AxiosHeaders } from 'axios'
import { showLoadingToast, showNotify } from 'vant'
import { clearToken, getToken } from '@/utils/auth'
import { locale as appLanguage } from '@/utils/i18n'

/** 与后端约定：仅 200 / 400 / 500 */
export const API_CODE_OK = 200
export const API_CODE_CLIENT = 400
export const API_CODE_SERVER = 500

export interface ApiEnvelope<T = unknown> {
  code: number
  data: T | null
  msg: string
}

export function isApiEnvelope(x: unknown): x is ApiEnvelope {
  return (
    x !== null
    && typeof x === 'object'
    && 'code' in x
    && typeof (x as ApiEnvelope).code === 'number'
    && 'data' in x
    && 'msg' in x
    && typeof (x as ApiEnvelope).msg === 'string'
  )
}

/** 无 redirectLogin 时的兜底（旧后端或校验类英文提示） */
const LOGIN_REQUIRED_HINTS = [
  '请先登录', '登录已失效', '登录凭证无效',
  'Please sign in', 'session has expired', 'Invalid credentials', 'sign in again',
]

function shouldRedirectToLogin(body: ApiEnvelope) {
  if (body.code !== API_CODE_CLIENT)
    return false
  const d = body.data as { redirectLogin?: boolean } | null | undefined
  if (d && typeof d === 'object' && d.redirectLogin === true)
    return true
  return LOGIN_REQUIRED_HINTS.some(h => body.msg.includes(h))
}

function handleBusinessFailure(body: ApiEnvelope) {
  const msg = body.msg || '请求失败'
  if (shouldRedirectToLogin(body)) {
    showNotify({ type: 'danger', message: msg })
    clearToken()
    const base = import.meta.env.BASE_URL || '/'
    const loginPath = base.endsWith('/')
      ? `${base}login`
      : `${base}/login`
    location.replace(loginPath)
    return
  }
  showNotify({
    type: 'danger',
    message: msg,
  })
}

function toFormBody(params?: Record<string, unknown>) {
  if (!params)
    return undefined
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '')
      sp.set(k, String(v))
  }
  return sp
}

export const requestPost = (
  url: string,
  params?: Record<string, unknown>,
  loadingMsg: string = '',
  showError: boolean = true,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    let toast = null
    if (loadingMsg !== '') {
      toast = showLoadingToast({ duration: 60000, message: loadingMsg, forbidClick: true })
    }
    const body = toFormBody(params)
    request
      .post(url, body, {
        headers: body
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : undefined,
      })
      .then((res: any) => {
        if (toast != null)
          toast.close()
        resolve(res)
      })
      .catch((err) => {
        if (toast != null)
          toast.close()
        if (err && err.code === 'ERR_CANCELED')
          return
        if (showError && !isApiEnvelope(err)) {
          const data = err.response?.data
          const msg = isApiEnvelope(data)
            ? data.msg
            : (data?.msg || data?.error || err.message || '网络异常')
          showNotify({ type: 'danger', message: msg })
        }
        reject(err)
      })
  })
}

export const requestGet = (url: string, params?: any, loadingMsg: string = ''): Promise<any> => {
  return new Promise((resolve, reject) => {
    let toast = null
    if (loadingMsg !== '') {
      toast = showLoadingToast({ duration: 60000, message: loadingMsg, forbidClick: true })
    }
    request
      .get(url, { params })
      .then((res: any) => {
        if (toast != null)
          toast.close()
        resolve(res)
      })
      .catch((err) => {
        if (toast != null)
          toast.close()
        if (err && err.code === 'ERR_CANCELED')
          return
        if (!isApiEnvelope(err)) {
          const data = err.response?.data
          const msg = isApiEnvelope(data)
            ? data.msg
            : (data?.msg || data?.error || err.message || '网络异常')
          showNotify({ type: 'danger', message: msg })
        }
        reject(err)
      })
  })
}

export const REQUEST_TOKEN_KEY = 'Authorization'

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
  timeout: 30000,
})

const pendingRequests = new Map<string, () => void>()
const generateReqKey = (config: InternalAxiosRequestConfig) => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

function requestHandler(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
  const lang = appLanguage.value || 'zh-CN'
  const headers = AxiosHeaders.from(config.headers ?? {})
  headers.set('Accept-Language', lang)
  headers.set('X-App-Language', lang)
  config.headers = headers

  const savedToken = getToken()
  if (savedToken) {
    const value = savedToken.startsWith('Bearer ')
      ? savedToken
      : `Bearer ${savedToken}`
    config.headers[REQUEST_TOKEN_KEY] = value
  }

  const requestKey = generateReqKey(config)
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey)!
    cancel()
    pendingRequests.delete(requestKey)
  }
  config.cancelToken = new axios.CancelToken((cancel) => {
    pendingRequests.set(requestKey, cancel)
  })
  return config
}

function responseHandler(response: AxiosResponse) {
  const requestKey = generateReqKey(response.config)
  pendingRequests.delete(requestKey)
  const body = response.data

  if (isApiEnvelope(body)) {
    if (body.code !== API_CODE_OK) {
      handleBusinessFailure(body)
      return Promise.reject(body)
    }
    return body.data
  }

  return body
}

request.interceptors.request.use(requestHandler, errorHandler)
request.interceptors.response.use(responseHandler, errorHandler)

export type RequestError = AxiosError<ApiEnvelope | { msg?: string, error?: string }>

function errorHandler(error: RequestError): Promise<any> {
  if (!error.response) {
    if (error.code !== 'ERR_CANCELED')
      showNotify({ type: 'danger', message: error.message || '网络不可用' })
    return Promise.reject(error)
  }

  const { data, statusText } = error.response
  const requestKey = generateReqKey(error.config!)
  pendingRequests.delete(requestKey)

  if (isApiEnvelope(data)) {
    handleBusinessFailure(data)
    return Promise.reject(data)
  }

  const msg = (data as { msg?: string })?.msg
    || (data as { error?: string })?.error
    || statusText
    || '网络异常'

  showNotify({ type: 'danger', message: msg })

  return Promise.reject(error)
}

export default request

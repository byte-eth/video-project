import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { showNotify, showLoadingToast } from 'vant'
import { clearToken, getToken } from './auth'

export const requestPost = (url: string, params?: any, loadingMsg: string = "", showError: boolean = true): Promise<any> => {
  return new Promise(function (resolve, reject) {
    let toast = null
    if (loadingMsg != "") {
      toast = showLoadingToast({ duration: 60000, message: loadingMsg, forbidClick: true });
    }
    request.postForm(url, params).then((res: any) => {
      if (toast != null) toast.close()
      if (res.code && res.code != 0) {
        if (showError) {
          showNotify({
            type: 'warning',
            message: res.msg,
          })
        }
        reject(res)
      }
      resolve(res.data)
    }).catch((err) => {
      if (toast != null) toast.close()
      if (err && err.code == "ERR_CANCELED") return
      if (err.response?.data?.error && showError) {
        showNotify({
          type: 'danger',
          message: err.response?.data?.error,
        })
      }
      reject(err.response?.data)
    })
  })
}

export const requestGet = (url: string, params?: any, loadingMsg: string = ""): Promise<any> => {
  return new Promise(function (resolve, reject) {
    let toast = null
    if (loadingMsg != "") {
      toast = showLoadingToast({ duration: 60000, message: loadingMsg, forbidClick: true });
    }
    request.get(url, { params }).then((res: any) => {
      if (toast != null) toast.close()
      if (res.code && res.code != 0) {
        showNotify({
          type: 'warning',
          message: res.msg,
        })
        reject(res)
      }
      resolve(res.data)
    }).catch((err) => {
      if (toast != null) toast.close()
      if (err && err.code == "ERR_CANCELED") return
      if (err.response?.data?.error) {
        showNotify({
          type: 'danger',
          message: err.response?.data?.error,
        })
      }
      reject(err.response.data)
    })
  })
}

// 这里是用于设定请求后端时，所用的 Token KEY
// 可以根据自己的需要修改，常见的如 Access-Token，Authorization
// 需要注意的是，请尽量保证使用中横线`-` 来作为分隔符，
// 避免被 nginx 等负载均衡器丢弃了自定义的请求头
export const REQUEST_TOKEN_KEY = 'Authorization'

// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
  timeout: 30000, // 请求超时时间
})

// 存储所有未完成的请求
const pendingRequests = new Map();
// 生成唯一请求键
const generateReqKey = (config) => {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
};

// 请求拦截器
function requestHandler(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
  let savedToken = getToken()
  // 如果 token 存在
  // 让每个请求携带自定义 token, 请根据实际情况修改
  if (savedToken)
    config.headers[REQUEST_TOKEN_KEY] = savedToken

  // 生成请求键
  const requestKey = generateReqKey(config);
  // 如果存在相同的请求，取消上一次的请求
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey);
    cancel();
    pendingRequests.delete(requestKey); // 删除旧请求
  }
  // 设置新的CancelToken
  config.cancelToken = new axios.CancelToken((cancel) => {
    pendingRequests.set(requestKey, cancel); // 存储新的请求
  });
  return config
}

// Add a request interceptor
request.interceptors.request.use(requestHandler, errorHandler)

// 响应拦截器
function responseHandler(response: { data: any }) {
  const requestKey = generateReqKey(response.data);
  pendingRequests.delete(requestKey); // 请求成功后移除请求
  return response.data
}

// Add a response interceptor
request.interceptors.response.use(responseHandler, errorHandler)

export type RequestError = AxiosError<{
  msg?: string
  data?: any
  errorMessage?: string
}>

// 异常拦截处理器
function errorHandler(error: RequestError): Promise<any> {
  if (error.response) {
    const { data = {}, status, statusText } = error.response
    // 403 无权限
    if (status === 403) {
      showNotify({
        type: 'danger',
        message: (data && data.msg) || statusText,
      })
    }
    // 401 未登录/未授权
    if (status === 401) {
      showNotify({
        type: 'danger',
        message: 'Authorization verification failed',
      })
      clearToken()
      location.replace('/login')
    }

    const requestKey = generateReqKey(error.config);
    pendingRequests.delete(requestKey); // 请求失败后移除请求
  }
  return Promise.reject(error)
}

export default request
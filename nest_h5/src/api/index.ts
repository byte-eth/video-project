import { requestPost,  requestGet } from '@/utils/request'

//用户 - 登录
export async function queryLogin(params: any, loadingMsg?: string): Promise<any> {
  return requestPost('/apps/auth/login', params, loadingMsg)
}

//发送邮箱验证码
export async function querySendEmailCode(params?: any, loadingMsg?: string): Promise<any> {
  return requestPost('/apps/user/sendEmailCode', params, loadingMsg)
}

//资产 - 获得指定币种
export async function queryGetAssetsCoin(params?: any, loadingMsg?: string): Promise<any> {
  return requestGet('/apps/assets/getAssetsCoin', params, loadingMsg)
}

//资产 - 获得币种资产列表
export async function queryGetAssetsCoinList(params?: any, loadingMsg?: string): Promise<any> {
  return requestGet('/apps/assets/getAssetsCoinList', params, loadingMsg)
}
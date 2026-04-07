import request from '@/utils/request'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  inviteCode?: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: number
    email: string
    username: string
    avatar?: string | null
    publicKey: string
  }
}

export interface UserProfile {
  id: number
  email: string
  username: string
  avatar?: string | null
  publicKey: string
  isVip: boolean
  createdAt: string
  inviteCode?: string
}

export interface UpdateUserProfilePayload {
  username?: string
  avatar?: string
}

export interface QiniuUploadTokenPayload {
  directory?: 'assets' | 'avatar' | 'public'
  fileName?: string
}

export interface QiniuUploadTokenResult {
  uploadToken: string
  key: string
  bucket: string
  uploadHost?: string
  cdnDomain?: string
  fileUrl?: string
  expiresIn: number
  directory: string
}

export interface UserState {
  uid?: number
  nickname?: string
  name?: string
  avatar?: string
  email?: string
  isVip?: boolean
  inviteCode?: string
}

export function login(data: LoginData): Promise<AuthSession> {
  return request.post('/auth/login', data) as Promise<AuthSession>
}

export function register(data: RegisterData): Promise<unknown> {
  return request.post('/auth/register', data)
}

export function forgotPasswordSendCode(email: string): Promise<{ ok: boolean }> {
  return request.post('/auth/forgot-password/send-code', { email }) as Promise<{
    ok: boolean
  }>
}

export interface ForgotPasswordResetPayload {
  email: string
  code: string
  newPassword: string
}

export function forgotPasswordReset(
  data: ForgotPasswordResetPayload,
): Promise<{ ok: boolean }> {
  return request.post('/auth/forgot-password/reset', data) as Promise<{
    ok: boolean
  }>
}

export function refreshSession(refresh_token: string): Promise<AuthSession> {
  return request.post('/auth/refresh', { refresh_token }) as Promise<AuthSession>
}

export function logout(refresh_token: string): Promise<unknown> {
  return request.post('/auth/logout', { refresh_token })
}

export function getUserInfo(): Promise<UserProfile> {
  return request.get('/auth/profile') as Promise<UserProfile>
}

export function updateUserProfile(data: UpdateUserProfilePayload): Promise<UserProfile> {
  return request.patch('/auth/profile', data) as Promise<UserProfile>
}

export function getQiniuUploadToken(data: QiniuUploadTokenPayload): Promise<QiniuUploadTokenResult> {
  return request.post('/uploads/qiniu/token', data) as Promise<QiniuUploadTokenResult>
}

export interface InvitedUserItem {
  id: number
  username: string
  email: string
  inviteCode: string
  avatar?: string | null
  /** 被邀请用户会员状态（后端返回字段） */
  isVip?: boolean
  createdAt: string
}

export interface MyInvitationsSummary {
  total: number
  items: InvitedUserItem[]
}

export function getMyInvitationsSummary(): Promise<MyInvitationsSummary> {
  return request.get('/users/me/invitations') as Promise<MyInvitationsSummary>
}

import request from '@/utils/request'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: number
    email: string
    username: string
    publicKey: string
  }
}

export interface UserProfile {
  id: number
  email: string
  username: string
  publicKey: string
  isVip: boolean
  createdAt: string
}

export interface UserState {
  uid?: number
  nickname?: string
  name?: string
  avatar?: string
  email?: string
  isVip?: boolean
}

export function login(data: LoginData): Promise<AuthSession> {
  return request.post('/auth/login', data) as Promise<AuthSession>
}

export function register(data: RegisterData): Promise<unknown> {
  return request.post('/auth/register', data)
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

// ============================================
// 认证工具：Token / 用户信息存取（纯 Taro Storage，无服务层依赖）
// ============================================

import Taro from '@tarojs/taro'
import { User, UserRole } from '@/types'

const TOKEN_KEY = 'pet_token'
const USER_KEY = 'pet_user'

export const getToken = (): string => Taro.getStorageSync(TOKEN_KEY) || ''
export const setToken = (token: string) => Taro.setStorageSync(TOKEN_KEY, token)
export const clearToken = () => {
  Taro.removeStorageSync(TOKEN_KEY)
  Taro.removeStorageSync(USER_KEY)
}
export const getCurrentUser = (): User | null =>
  (Taro.getStorageSync(USER_KEY) || null) as User | null
export const setCurrentUser = (user: User) => Taro.setStorageSync(USER_KEY, user)
export const isLoggedIn = (): boolean => !!getToken()

export const maskPhone = (phone: string): string =>
  phone ? phone.slice(0, 3) + '****' + phone.slice(-4) : ''

/** 检查登录状态，未登录则跳转登录页 */
export const requireLogin = (): boolean => {
  if (isLoggedIn()) return true
  Taro.navigateTo({ url: '/pages/login/index' })
  return false
}

/** 角色相关工具 */
export const getRole = (): UserRole | null => getCurrentUser()?.role ?? null
export const isProvider = (): boolean => getRole() === 'provider'
export const isCustomer = (): boolean => getRole() === 'customer'

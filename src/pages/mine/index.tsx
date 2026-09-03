import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { authService, providerService } from '@/services'
import { getCurrentUser, clearToken, isLoggedIn, maskPhone, isProvider, isCustomer } from '@/utils/auth'
import { User } from '@/types'
import styles from './index.module.scss'

const MinePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [earnings, setEarnings] = useState<any>(null)

  useDidShow(() => {
    // 先从缓存即时读取
    const cached = getCurrentUser()
    if (cached) {
      setUser(cached)
      // 服务人员加载收入统计
      if (isProvider()) {
        providerService.getEarnings().then(e => setEarnings(e)).catch(() => setEarnings(null))
      } else {
        setEarnings(null)
      }
      // 有 token 时尝试验证
      if (isLoggedIn()) {
        authService.me().then(u => {
          setUser(u)
          if (u.role === 'provider') {
            providerService.getEarnings().then(e => setEarnings(e)).catch(() => setEarnings(null))
          } else {
            setEarnings(null)
          }
        }).catch(() => {
          clearToken()
          setUser(null)
          setEarnings(null)
        })
      }
    } else {
      setUser(null)
      setEarnings(null)
    }
  })

  const menuItems = isProvider() ? [
    { icon: '📋', text: '接单管理', path: 'switchTab:/pages/orders/index' },
    { icon: '💰', text: '收入统计', path: '/pages/provider-earnings/index' },
    { icon: '👤', text: '个人资料', path: '/pages/provider-profile/index' },
    { icon: '📞', text: '联系客服', path: '' }
  ] : [
    { icon: '🐾', text: '我的宠物', path: '/pages/pets/index' },
    { icon: '📍', text: '地址管理', path: '/pages/addresses/index' },
    { icon: '🎫', text: '优惠券', path: '' },
    { icon: '📞', text: '联系客服', path: '' },
    { icon: '⚙️', text: '设置', path: '' }
  ]

  const handleMenuClick = (path: string) => {
    if (path.startsWith('switchTab:')) {
      Taro.switchTab({ url: path.slice('switchTab:'.length) })
    } else if (path) {
      Taro.navigateTo({ url: path })
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  const handleLogin = () => {
    if (!user) {
      Taro.navigateTo({ url: '/pages/login/index' })
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearToken()
          setUser(null)
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className={styles.page}>
      {/* 用户信息头部 */}
      <View className={styles.profileHeader} onClick={handleLogin}>
        <View className={styles.profileInfo}>
          <View className={styles.avatar}>{user ? '🐱' : '👤'}</View>
          <View className={styles.userInfo}>
            <View className={styles.nicknameRow}>
              <Text className={styles.nickname}>
                {user ? (user.nickname || '铲屎官') : '点击登录'}
              </Text>
              {user && (
                <Text className={`${styles.roleBadge} ${user.role === 'provider' ? styles.provider : ''}`}>
                  {user.role === 'provider' ? '服务人员' : '顾客'}
                </Text>
              )}
            </View>
            <Text className={styles.phone}>
              {user ? maskPhone(user.phone) : '登录后享受更多服务'}
            </Text>
          </View>
        </View>
      </View>

      {/* 统计数据 */}
      {isProvider() ? (
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{earnings?.thisMonthEarnings ?? 0}</Text>
            <Text className={styles.statLabel}>本月收入</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{earnings?.pendingPayout ?? 0}</Text>
            <Text className={styles.statLabel}>待结算</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{earnings?.completedCount ?? 0}</Text>
            <Text className={styles.statLabel}>累计成单</Text>
          </View>
        </View>
      ) : (
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>4</Text>
            <Text className={styles.statLabel}>我的宠物</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>4</Text>
            <Text className={styles.statLabel}>订单总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>1</Text>
            <Text className={styles.statLabel}>优惠券</Text>
          </View>
        </View>
      )}

      {/* 菜单列表 */}
      <View className={styles.sectionTitle}>服务管理</View>
      <View className={styles.menuSection}>
        {menuItems.map((item, i) => (
          <View key={i} className={styles.menuItem} onClick={() => handleMenuClick(item.path)}>
            <Text className={styles.menuIcon}>{item.icon}</Text>
            <Text className={styles.menuText}>{item.text}</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
        {user && (
          <View className={styles.menuItem} onClick={handleLogout}>
            <Text className={styles.menuIcon}>🚪</Text>
            <Text className={styles.menuText}>退出登录</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionTitle}>关于我们</View>
      <View className={styles.menuSection}>
        <View className={styles.menuItem} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
          <Text className={styles.menuIcon}>📜</Text>
          <Text className={styles.menuText}>服务协议</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
          <Text className={styles.menuIcon}>🔒</Text>
          <Text className={styles.menuText}>隐私政策</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default MinePage

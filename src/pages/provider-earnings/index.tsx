import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { providerService } from '@/services'
import { isProvider } from '@/utils/auth'
import { ProviderEarnings } from '@/types'
import styles from './index.module.scss'

const ProviderEarningsPage: React.FC = () => {
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadEarnings = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await providerService.getEarnings()
      setEarnings(data)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    if (!isProvider()) {
      Taro.showToast({ title: '无权访问', icon: 'none' })
      Taro.navigateBack()
      return
    }
    loadEarnings()
  })

  if (loading) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}><Text>加载中...</Text></View>
      </View>
    )
  }

  if (error || !earnings) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}><Text>加载失败，请重试</Text></View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.highlightCard}>
        <Text className={styles.highlightLabel}>本月收入</Text>
        <Text className={styles.highlightValue}>¥{earnings.thisMonthEarnings}</Text>
      </View>

      <View className={styles.statGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>¥{earnings.totalEarnings}</Text>
          <Text className={styles.statLabel}>累计收入</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>¥{earnings.pendingPayout}</Text>
          <Text className={styles.statLabel}>待结算</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>¥{earnings.commissionTotal}</Text>
          <Text className={styles.statLabel}>平台抽成</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{earnings.completedCount}单</Text>
          <Text className={styles.statLabel}>累计成单</Text>
        </View>
      </View>

      <View className={styles.countRow}>
        <View className={styles.countItem}>
          <Text className={styles.countValue}>{earnings.acceptedCount}</Text>
          <Text className={styles.countLabel}>已接单</Text>
        </View>
        <View className={styles.countItem}>
          <Text className={styles.countValue}>{earnings.inProgressCount}</Text>
          <Text className={styles.countLabel}>进行中</Text>
        </View>
        <View className={styles.countItem}>
          <Text className={styles.countValue}>{earnings.totalCount}</Text>
          <Text className={styles.countLabel}>总计</Text>
        </View>
      </View>
    </View>
  )
}

export default ProviderEarningsPage

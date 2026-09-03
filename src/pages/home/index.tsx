import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

const HomePage: React.FC = () => {
  const handleBookCat = () => {
    Taro.navigateTo({ url: '/pages/book-cat/index' })
  }

  const handleBookDog = () => {
    Taro.navigateTo({ url: '/pages/book-dog/index' })
  }

  const features = [
    { icon: '🧤', text: '上门消毒' },
    { icon: '📸', text: '全程拍照' },
    { icon: '💬', text: '实时沟通' },
    { icon: '🏠', text: '熟悉环境' },
    { icon: '💊', text: '喂药护理' },
    { icon: '🪮', text: '梳毛陪玩' },
    { icon: '🚶', text: '户外遛狗' },
    { icon: '📦', text: '代收快递' }
  ]

  const hotItems = [
    { rank: '1', title: '春节上门喂猫', tag: '含梳毛+陪玩', price: '28元起' },
    { rank: '2', title: '周末遛狗包月', tag: '每周2次·30天', price: '180元/月' },
    { rank: '3', title: '多猫家庭服务', tag: '3只猫含全套服务', price: '35元起' }
  ]

  return (
    <View className={styles.page}>
      {/* 顶部问候 */}
      <View className={styles.header}>
        <Text className={styles.greeting}>你好呀，铲屎官 🐾</Text>
        <View className={styles.location}>
          <Text>📍</Text>
          <Text>宜昌</Text>
        </View>
      </View>

      {/* Banner */}
      <View className={styles.banner}>
        <View className={styles.bannerText}>
          <Text className={styles.bannerTitle}>萌宠管家</Text>
          <Text className={styles.bannerSub}>您出差旅行，我替您陪伴毛孩子</Text>
        </View>
        <Text className={styles.bannerEmoji}>🐱🐶</Text>
      </View>

      {/* 服务卡片 */}
      <View className={styles.serviceCards}>
        <View className={`${styles.serviceCard} ${styles.catCard}`} onClick={handleBookCat}>
          <Text className={styles.cardIcon}>🐱</Text>
          <Text className={styles.cardTitle}>上门喂猫</Text>
          <Text className={styles.cardDesc}>铲屎·添粮·梳毛·陪玩</Text>
          <Text className={styles.cardPrice}>20元/次起</Text>
        </View>
        <View className={`${styles.serviceCard} ${styles.dogCard}`} onClick={handleBookDog}>
          <Text className={styles.cardIcon}>🐶</Text>
          <Text className={styles.cardTitle}>上门遛狗</Text>
          <Text className={styles.cardDesc}>遛狗30分钟·喂食·擦脚</Text>
          <Text className={styles.cardPrice}>25元/次起</Text>
        </View>
      </View>

      {/* 特色功能 */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>服务特色</Text>
        </View>
        <View className={styles.featureGrid}>
          {features.map((f, i) => (
            <View key={i} className={styles.featureItem}>
              <Text className={styles.featureIcon}>{f.icon}</Text>
              <Text className={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 热门推荐 */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>热门推荐</Text>
          <Text className={styles.sectionMore}>更多 ›</Text>
        </View>
        <View className={styles.hotList}>
          {hotItems.map((item, i) => (
            <View key={i} className={styles.hotItem}>
              <View className={styles.hotRank}>{item.rank}</View>
              <View className={styles.hotContent}>
                <Text className={styles.hotTitle}>{item.title}</Text>
                <Text className={styles.hotTag}>{item.tag}</Text>
              </View>
              <Text className={styles.hotPrice}>{item.price}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部快速预约 */}
      <View className={styles.quickBook}>
        <Button className={`${styles.quickBtn} ${styles.catBtn}`} onClick={handleBookCat}>
          🐱 预约喂猫
        </Button>
        <Button className={`${styles.quickBtn} ${styles.dogBtn}`} onClick={handleBookDog}>
          🐶 预约遛狗
        </Button>
      </View>
    </View>
  )
}

export default HomePage

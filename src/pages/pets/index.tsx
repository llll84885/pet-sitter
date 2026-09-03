import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { petService } from '@/services'
import { Pet } from '@/types'
import styles from './index.module.scss'

const PetsPage: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)

  const loadPets = async () => {
    setLoading(true)
    try {
      const list = await petService.list()
      setPets(list || [])
    } catch (err) {
      console.error('[PetsPage] 加载失败', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { loadPets() })

  const handleAddPet = () => {
    Taro.showToast({ title: '添加宠物功能开发中', icon: 'none' })
  }

  const handlePetClick = () => {
    Taro.showToast({ title: '编辑宠物功能开发中', icon: 'none' })
  }

  const getDogSizeText = (size?: string) => {
    const map: Record<string, string> = { small: '小型犬', medium: '中型犬', large: '大型犬' }
    return size ? map[size] || '' : ''
  }

  return (
    <View className={styles.page}>
      <View className={styles.addCard} onClick={handleAddPet}>
        <Text className={styles.addIcon}>＋</Text>
        <Text className={styles.addText}>添加新宠物</Text>
      </View>

      {loading && pets.length === 0 && (
        <View style={{ textAlign: 'center', padding: '80rpx', color: '#A8A29B' }}>
          <Text>⏳ 加载中...</Text>
        </View>
      )}

      {!loading && pets.length === 0 && (
        <View style={{ textAlign: 'center', padding: '80rpx', color: '#A8A29B' }}>
          <Text>还没有添加宠物，点击上方按钮添加</Text>
        </View>
      )}

      <View className={styles.petList}>
        {pets.map(pet => (
          <View
            key={pet.id}
            className={`${styles.petCard} ${pet.type === 'cat' ? styles.catCard : styles.dogCard}`}
            onClick={handlePetClick}
          >
            <View className={styles.cardHeader}>
              <View className={styles.petAvatar}>{pet.type === 'cat' ? '🐱' : '🐶'}</View>
              <View className={styles.petMain}>
                <Text className={styles.petName}>{pet.name}</Text>
                <Text className={styles.petBreed}>{pet.breed}</Text>
              </View>
            </View>
            <View className={styles.petDetails}>
              {pet.type === 'dog' && pet.weight && (
                <Text className={styles.detailTag}>{pet.weight}kg</Text>
              )}
              {pet.type === 'dog' && (pet as any).dog_size && (
                <Text className={styles.detailTag}>{getDogSizeText((pet as any).dog_size)}</Text>
              )}
              {pet.personality && <Text className={styles.detailTag}>{pet.personality}</Text>}
            </View>
            {pet.notes && (
              <Text className={styles.petNote}>📝 {pet.notes}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

export default PetsPage

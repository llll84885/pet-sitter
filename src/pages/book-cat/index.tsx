import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { CAT_ADDONS } from '@/data/addons'
import { petService, priceService, orderService, addressService } from '@/services'
import { Pet, AddOnItem, PriceResult } from '@/types'
import { requireLogin } from '@/utils/auth'
import styles from './index.module.scss'

const BookCatPage: React.FC = () => {
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [selectedPets, setSelectedPets] = useState<string[]>([])
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [address, setAddress] = useState('')
  const [distance, setDistance] = useState(2.5)
  const [submitting, setSubmitting] = useState(false)

  // 加载宠物数据
  const loadPets = async () => {
    try {
      const list = await petService.list()
      setAllPets(list || [])
      if (list && list.length > 0) {
        const firstCat = list.find(p => p.type === 'cat')
        if (firstCat && selectedPets.length === 0) {
          setSelectedPets([firstCat.id])
        }
      }
    } catch (err) {
      console.error('[BookCat] 加载宠物失败', err)
    }
  }

  useDidShow(() => { loadPets() })
  useEffect(() => { loadPets() }, [])

  const cats = allPets.filter(p => p.type === 'cat')

  const dateOptions = useMemo(() => {
    const dates: { day: string; num: string; date: string; isHoliday: boolean }[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
      const holidayCheck = () => {
        if (month === 10 && day >= 1 && day <= 7) return true
        if (month === 5 && day >= 1 && day <= 5) return true
        if (month === 1 && day >= 1 && day <= 3) return true
        if (month === 4 && day >= 4 && day <= 6) return true
        return false
      }
      dates.push({
        day: i === 0 ? '今天' : i === 1 ? '明天' : `周${weekdays[d.getDay()]}`,
        num: `${month}/${day}`,
        date: `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isHoliday: holidayCheck()
      })
    }
    return dates
  }, [])

  const timeOptions = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']

  const selectedPetList: Pet[] = useMemo(() => {
    return selectedPets.map(id => allPets.find(p => p.id === id)).filter(Boolean) as Pet[]
  }, [selectedPets, allPets])

  const selectedAddonList: AddOnItem[] = useMemo(() => {
    return selectedAddons.map(id => CAT_ADDONS.find(a => a.id === id)).filter(Boolean) as AddOnItem[]
  }, [selectedAddons])

  // 通过服务层（后端或Mock降级）计算价格
  const [priceResult, setPriceResult] = useState<PriceResult>({
    basePrice: 20, distanceFee: 0, petCountFee: 0, addOnsFee: 0, holidayFee: 0,
    totalPrice: 20, details: [{ label: '上门喂猫 基础价', amount: 20 }]
  })

  const updatePrice = async () => {
    try {
      const petsForCalc = selectedPetList.length > 0
        ? selectedPetList
        : [{ id: 'temp', name: '', type: 'cat', breed: '', personality: '' }] as Pet[]
      const result = await priceService.calc({
        serviceType: 'cat',
        distance,
        pets: petsForCalc,
        addOns: selectedAddonList,
        date: selectedDate || new Date().toISOString().split('T')[0]
      })
      if (result) setPriceResult(result)
    } catch (err) {
      console.warn('[BookCat] 价格计算失败', err)
    }
  }

  useEffect(() => { updatePrice() }, [selectedAddons.join(','), selectedDate, distance])

  const togglePet = (id: string) => {
    setSelectedPets(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      return next
    })
  }

  // 选宠物后也要计算
  useEffect(() => {
    if (selectedPets.length > 0) updatePrice()
  }, [selectedPets.join(',')])

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handlePickAddress = async () => {
    if (!requireLogin()) return
    try {
      const list = await addressService.list()
      if (list.length === 0) {
        Taro.showToast({ title: '暂无保存地址，请手动输入', icon: 'none' })
        return
      }
      const itemList = list.map(a => `${a.contactName} ${a.phone} · ${a.detail}${a.isDefault ? ' (默认)' : ''}`)
      itemList.push('✏️ 手动输入')
      Taro.showActionSheet({
        itemList,
        success: (res) => {
          if (res.tapIndex < list.length) {
            setAddress(list[res.tapIndex].detail)
          }
        }
      })
    } catch {
      Taro.showToast({ title: '获取地址失败', icon: 'none' })
    }
  }

  const handleSubmit = async () => {
    if (!selectedDate) {
      Taro.showToast({ title: '请选择服务日期', icon: 'none' })
      return
    }
    if (!selectedTime) {
      Taro.showToast({ title: '请选择服务时间', icon: 'none' })
      return
    }
    if (selectedPets.length === 0) {
      Taro.showToast({ title: '请选择宠物', icon: 'none' })
      return
    }
    if (!address) {
      Taro.showToast({ title: '请填写服务地址', icon: 'none' })
      return
    }
    if (submitting) return
    setSubmitting(true)

    try {
      // 最终价格（再算一次保证一致）
      const finalPrice = priceResult

      const created = await orderService.create({
        serviceType: 'cat',
        serviceDate: selectedDate,
        serviceTime: selectedTime + '-' + (parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':' + selectedTime.split(':')[1],
        address,
        distance,
        petIds: selectedPets,
        pets: selectedPetList, // 供 mock 使用
        addOns: selectedAddonList,
        price: finalPrice.totalPrice,
        priceDetails: finalPrice.details
      })

      Taro.showToast({ title: '下单成功！', icon: 'success' })
      setTimeout(() => {
        if (created?.id) {
          Taro.redirectTo({ url: `/pages/order-detail/index?id=${created.id}` })
        } else {
          Taro.switchTab({ url: '/pages/orders/index' })
        }
      }, 1200)
    } catch (err) {
      console.error('[BookCat] 下单失败', err)
      Taro.showToast({ title: '下单失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.serviceHeader}>
        <Text className={styles.headerTitle}>🐱 上门喂猫</Text>
        <Text className={styles.headerDesc}>铲屎·添粮·梳毛·陪玩，基础价20元/次</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📋 基础服务内容</Text>
        <View className={styles.basicService}>
          {[
            ['🧤', '上门消毒防护：穿戴一次性鞋套、手套'],
            ['🍚', '清洁猫碗 + 添粮 + 更换新鲜饮用水'],
            ['💩', '铲屎 + 添砂，所有垃圾打包带走'],
            ['🧹', '清理散落的猫砂、水碗周边污渍'],
            ['🪟', '适当开窗通风，临走前关好门窗'],
            ['📸', '拍照/视频反馈（≥3张照片）']
          ].map(([ic, t], i) => (
            <View key={i} className={styles.serviceItem}>
              <Text className={styles.serviceIcon}>{ic}</Text>
              <Text>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>🐾 选择服务的猫咪</Text>
        {cats.length === 0 && (
          <Text style={{ fontSize: '28rpx', color: '#A8A29B' }}>暂无猫咪，请先在「我的-我的宠物」添加</Text>
        )}
        <View className={styles.petList}>
          {cats.map(pet => {
            const isSelected = selectedPets.includes(pet.id)
            return (
              <View
                key={pet.id}
                className={`${styles.petItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => togglePet(pet.id)}
              >
                <View className={styles.petAvatar}>🐱</View>
                <View className={styles.petInfo}>
                  <Text className={styles.petName}>{pet.name}</Text>
                  <Text className={styles.petBreed}>{pet.breed} · {pet.personality}</Text>
                </View>
                <View className={`${styles.petCheckbox} ${isSelected ? styles.checked : ''}`}>
                  {isSelected ? '✓' : ''}
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📅 选择服务时间</Text>
        <View className={styles.dateTimeSection}>
          <View className={styles.dateRow}>
            {dateOptions.map((item, i) => {
              const isSelected = selectedDate === item.date
              return (
                <View
                  key={i}
                  className={`${styles.dateItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedDate(item.date)}
                >
                  <Text className={styles.dateDay}>
                    {item.day}
                    {item.isHoliday && <Text className={styles.holidayTag}>假</Text>}
                  </Text>
                  <Text className={styles.dateNum}>{item.num}</Text>
                </View>
              )
            })}
          </View>
          <View className={styles.timeRow}>
            {timeOptions.map(time => {
              const isSelected = selectedTime === time
              return (
                <View
                  key={time}
                  className={`${styles.timeItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </View>
              )
            })}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>✨ 升级服务（可选）</Text>
        <View className={styles.addonList}>
          {CAT_ADDONS.map(addon => {
            const isSelected = selectedAddons.includes(addon.id)
            return (
              <View
                key={addon.id}
                className={`${styles.addonItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => toggleAddon(addon.id)}
              >
                <View className={styles.addonInfo}>
                  <Text className={styles.addonName}>{addon.name}</Text>
                  <Text className={styles.addonDesc}>{addon.description}</Text>
                </View>
                <Text className={styles.addonPrice}>+¥{addon.price}</Text>
                <View className={`${styles.addonCheckbox} ${isSelected ? styles.checked : ''}`}>
                  {isSelected ? '✓' : ''}
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📍 服务地址</Text>
        <Input
          className={styles.addressInput}
          placeholder="请输入详细地址"
          value={address}
          onInput={(e) => setAddress(e.detail.value)}
        />
        <View className={styles.pickAddress} onClick={handlePickAddress}>
          📍 从保存的地址中选择 ›
        </View>
        <View style={{ marginTop: '24rpx', display: 'flex', alignItems: 'center', gap: '16rpx' }}>
          <Text style={{ fontSize: '28rpx', color: '#6B6560' }}>距离：</Text>
          <Input
            type="digit"
            style={{
              flex: 1, padding: '16rpx 24rpx', border: '4rpx solid #F0E8DE',
              borderRadius: '12rpx', fontSize: '28rpx', background: '#F5EDE3'
            }}
            value={String(distance)}
            onInput={(e) => setDistance(parseFloat(e.detail.value) || 0)}
          />
          <Text style={{ fontSize: '28rpx', color: '#6B6560' }}>km</Text>
        </View>
        <Text className={styles.distanceInfo}>
          3公里内不加价，3-5公里加3元，5公里以上加5元
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💰 定价明细</Text>
        <View className={styles.priceDetails}>
          {priceResult.details.map((item, i) => (
            <View key={i} className={styles.detailItem}>
              <Text className={styles.detailLabel}>{item.label}</Text>
              <Text className={styles.detailAmount}>¥{item.amount}</Text>
            </View>
          ))}
          <View className={`${styles.detailItem} ${styles.totalRow}`}>
            <Text className={styles.detailLabel}>合计</Text>
            <Text className={styles.detailAmount}>¥{priceResult.totalPrice}</Text>
          </View>
        </View>
      </View>

      <View className={styles.priceBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>预估金额</Text>
          <Text className={styles.priceValue}>¥{priceResult.totalPrice}</Text>
        </View>
        <Button className={styles.submitBtn} disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '立即下单'}
        </Button>
      </View>
    </View>
  )
}

export default BookCatPage

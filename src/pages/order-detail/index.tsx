import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { orderService, providerService } from '@/services'
import { isProvider, getCurrentUser } from '@/utils/auth'
import { Order, OrderStatus } from '@/types'
import styles from './index.module.scss'

const OrderDetailPage: React.FC = () => {
  const router = useRouter()
  const orderId = router.params?.id || ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const providerMode = isProvider()
  const currentUser = getCurrentUser()
  const isMyOrder = providerMode && order?.providerId === currentUser?.id

  const loadOrder = async () => {
    if (!orderId) {
      Taro.showToast({ title: '订单ID缺失', icon: 'none' })
      setLoading(false)
      return
    }
    try {
      const o = await orderService.get(orderId)
      setOrder(o || null)
    } catch (err) {
      console.error('[OrderDetail] 加载失败', err)
      Taro.showToast({ title: '订单加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrder() }, [orderId])

  const statusMap: Record<OrderStatus, { icon: string; title: string; desc: string }> = {
    pending: { icon: '⏳', title: '等待接单', desc: providerMode ? '该订单可接，点击下方按钮接单' : '服务人员将尽快接单' },
    accepted: { icon: '✅', title: '已接单', desc: '服务人员已确认接单' },
    inProgress: { icon: '🚀', title: '服务中', desc: '服务人员正在为您服务' },
    completed: { icon: '🎉', title: '已完成', desc: '服务已完成，感谢使用' },
    cancelled: { icon: '❌', title: '已取消', desc: '订单已取消' }
  }

  // ---- 操作 ----
  const handleAccept = async () => {
    if (acting) return
    try {
      const res = await Taro.showModal({
        title: '确认接单',
        content: `接单后可得收入 ¥${Math.round((order?.price || 0) * 0.95)}（平台抽成5%）`,
        confirmText: '确认接单'
      })
      if (!res.confirm) return
    } catch { return }
    setActing(true)
    try {
      await providerService.accept(orderId)
      Taro.showToast({ title: '接单成功', icon: 'success' })
      loadOrder()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '接单失败', icon: 'none' })
    } finally { setActing(false) }
  }

  const handleStatusChange = async (status: OrderStatus, label: string) => {
    if (acting) return
    try {
      const res = await Taro.showModal({ title: label, content: `确认${label}？`, confirmText: '确认' })
      if (!res.confirm) return
    } catch { return }
    setActing(true)
    try {
      await orderService.updateStatus(orderId, status)
      Taro.showToast({ title: `${label}成功`, icon: 'success' })
      loadOrder()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally { setActing(false) }
  }

  const handleCancel = async () => {
    if (acting) return
    try {
      const res = await Taro.showModal({ title: '取消订单', content: '确定取消该订单吗？', confirmText: '取消订单' })
      if (!res.confirm) return
    } catch { return }
    setActing(true)
    try {
      await orderService.updateStatus(orderId, 'cancelled')
      Taro.showToast({ title: '订单已取消', icon: 'success' })
      loadOrder()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally { setActing(false) }
  }

  if (loading) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '120rpx 0', textAlign: 'center', color: '#A8A29B' }}>
          <Text>⏳ 加载中...</Text>
        </View>
      </View>
    )
  }

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '120rpx 0', textAlign: 'center', color: '#A8A29B' }}>
          <Text>❌ 订单不存在</Text>
        </View>
      </View>
    )
  }

  const status = statusMap[order.status]
  const commission = order.commission || Math.round(order.price * 0.05)
  const earning = order.providerEarning || (order.price - commission)

  return (
    <View className={styles.page}>
      <View className={`${styles.statusBanner} ${order.status}`}>
        <Text className={styles.statusIcon}>{status.icon}</Text>
        <View className={styles.statusInfo}>
          <Text className={styles.statusTitle}>{status.title}</Text>
          <Text className={styles.statusDesc}>{status.desc}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📋 服务信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务类型</Text>
          <Text className={styles.infoValue}>
            {order.serviceType === 'cat' ? '🐱 上门喂猫' : '🐶 上门遛狗'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务时间</Text>
          <Text className={styles.infoValue}>{order.serviceDate} {order.serviceTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务地址</Text>
          <Text className={styles.infoValue}>{order.address}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>距离</Text>
          <Text className={styles.infoValue}>{order.distance}公里</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>下单时间</Text>
          <Text className={styles.infoValue}>{order.createdAt}</Text>
        </View>
        {order.note && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>备注</Text>
            <Text className={styles.infoValue}>{order.note}</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>🐾 服务宠物</Text>
        <View className={styles.petList}>
          {(order.pets || []).map((pet, i) => (
            <View key={i} className={styles.petCard}>
              <View className={styles.petAvatar}>{pet.type === 'cat' ? '🐱' : '🐶'}</View>
              <View className={styles.petInfo}>
                <Text className={styles.petName}>{pet.name}</Text>
                <Text className={styles.petBreed}>{pet.breed} · {pet.personality}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {order.addOns && order.addOns.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>✨ 升级服务</Text>
          <View className={styles.addonTags}>
            {order.addOns.map((addon, i) => (
              <Text key={i} className={styles.addonTag}>{addon.name}</Text>
            ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💰 价格明细</Text>
        <View className={styles.priceDetail}>
          {(order.priceDetails || []).map((item, i) => (
            <View key={i} className={styles.priceRow}>
              <Text className={styles.rowLabel}>{item.label}</Text>
              <Text className={styles.rowAmount}>¥{item.amount}</Text>
            </View>
          ))}
          {providerMode && order.providerId && (
            <>
              <View className={styles.priceRow}>
                <Text className={styles.rowLabel}>平台抽成（5%）</Text>
                <Text className={styles.rowAmount}>- ¥{commission}</Text>
              </View>
              <View className={`${styles.priceRow} ${styles.earningRow}`}>
                <Text className={styles.rowLabel}>你的收入</Text>
                <Text className={styles.rowAmount}>¥{earning}</Text>
              </View>
            </>
          )}
          <View className={`${styles.priceRow} ${styles.totalRow}`}>
            <Text className={styles.rowLabel}>{providerMode && order.providerId ? '订单金额' : '实付金额'}</Text>
            <Text className={styles.rowAmount}>¥{order.price}</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className={styles.actionBar}>
        {providerMode && order.status === 'pending' && !order.providerId && (
          <View className={`${styles.barBtn} ${styles.barBtnPrimary}`} onClick={handleAccept}>
            <Text>{acting ? '处理中...' : `立即接单 · 收入 ¥${Math.round(order.price * 0.95)}`}</Text>
          </View>
        )}
        {providerMode && isMyOrder && order.status === 'accepted' && (
          <View className={`${styles.barBtn} ${styles.barBtnPrimary}`} onClick={() => handleStatusChange('inProgress', '开始服务')}>
            <Text>{acting ? '处理中...' : '开始服务'}</Text>
          </View>
        )}
        {providerMode && isMyOrder && order.status === 'inProgress' && (
          <View className={`${styles.barBtn} ${styles.barBtnSuccess}`} onClick={() => handleStatusChange('completed', '完成服务')}>
            <Text>{acting ? '处理中...' : '完成服务 · 结算 ¥' + earning}</Text>
          </View>
        )}
        {!providerMode && order.status === 'pending' && (
          <View className={`${styles.barBtn} ${styles.barBtnDanger}`} onClick={handleCancel}>
            <Text>{acting ? '处理中...' : '取消订单'}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default OrderDetailPage

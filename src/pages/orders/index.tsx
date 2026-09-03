import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderService, providerService } from '@/services'
import { isProvider, requireLogin } from '@/utils/auth'
import { Order, OrderStatus } from '@/types'
import styles from './index.module.scss'

const OrdersPage: React.FC = () => {
  const providerMode = isProvider()

  // ---- 顾客模式：状态Tab ----
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  // ---- 服务人员模式：待接单 / 我的接单 ----
  const [providerScope, setProviderScope] = useState<'available' | 'mine'>('available')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const customerTabs: { key: OrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待接单' },
    { key: 'accepted', label: '已接单' },
    { key: 'inProgress', label: '进行中' },
    { key: 'completed', label: '已完成' }
  ]

  const loadOrders = async () => {
    setLoading(true)
    try {
      if (providerMode) {
        const list = await providerService.listOrders({ scope: providerScope })
        setOrders(list || [])
      } else {
        const list = await orderService.list({ status: activeTab })
        setOrders(list || [])
      }
    } catch (err) {
      console.error('[OrdersPage] 加载订单失败', err)
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    if (providerMode && !requireLogin()) return
    loadOrders()
  })

  useEffect(() => { loadOrders() }, [activeTab, providerScope])

  const getStatusText = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending: '待接单',
      accepted: '已接单',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return map[status]
  }

  const getStatusClass = (status: OrderStatus) => {
    return `${styles.statusTag} ${styles[`status${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`
  }

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })
  }

  // ---- 服务人员操作 ----
  const handleAccept = async (order: Order, e: any) => {
    e?.stopPropagation?.()
    if (!requireLogin()) return
    try {
      const res = await Taro.showModal({ title: '确认接单', content: `接单后可得收入 ¥${Math.round(order.price * 0.95)}（平台抽成5%）`, confirmText: '确认接单' })
      if (!res.confirm) return
    } catch { return /* 用户取消 */ }
    try {
      await providerService.accept(order.id)
      Taro.showToast({ title: '接单成功', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '接单失败', icon: 'none' })
    }
  }

  const handleStart = async (order: Order, e: any) => {
    e?.stopPropagation?.()
    try {
      await orderService.updateStatus(order.id, 'inProgress')
      Taro.showToast({ title: '已开始服务', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }

  const handleComplete = async (order: Order, e: any) => {
    e?.stopPropagation?.()
    try {
      const res = await Taro.showModal({ title: '完成服务', content: '确认服务已完成？完成后将结算收入', confirmText: '确认完成' })
      if (!res.confirm) return
      await orderService.updateStatus(order.id, 'completed')
      Taro.showToast({ title: '服务完成，收入已结算', icon: 'success' })
      loadOrders()
    } catch (err: any) {
      if (err?.errMsg?.includes('cancel')) return
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }

  return (
    <View className={styles.page}>
      {providerMode ? (
        // ---- 服务人员模式 ----
        <View className={styles.tabs}>
          <View
            className={`${styles.tabItem} ${providerScope === 'available' ? styles.active : ''}`}
            onClick={() => setProviderScope('available')}
          >
            待接单
          </View>
          <View
            className={`${styles.tabItem} ${providerScope === 'mine' ? styles.active : ''}`}
            onClick={() => setProviderScope('mine')}
          >
            我的接单
          </View>
        </View>
      ) : (
        // ---- 顾客模式 ----
        <View className={styles.tabs}>
          {customerTabs.map(tab => (
            <View
              key={tab.key}
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </View>
      )}

      {loading && orders.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>⏳</Text>
          <Text className={styles.emptyText}>加载中...</Text>
        </View>
      )}

      {!loading && orders.length > 0 && (
        <View className={styles.orderList}>
          {orders.map(order => (
            <View key={order.id} className={styles.orderCard} onClick={() => handleOrderClick(order)}>
              <View className={styles.cardHeader}>
                <Text className={styles.serviceType}>
                  {order.serviceType === 'cat' ? '🐱 上门喂猫' : '🐶 上门遛狗'}
                </Text>
                <Text className={getStatusClass(order.status)}>{getStatusText(order.status)}</Text>
              </View>
              <View className={styles.cardBody}>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>日期时间</Text>
                  <Text className={styles.infoValue}>{order.serviceDate} {order.serviceTime}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>宠物</Text>
                  <Text className={styles.infoValue}>
                    {(order.pets || []).map(p => `${p.type === 'cat' ? '🐱' : '🐶'}${p.name}`).join('、')}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>地址</Text>
                  <Text className={styles.infoValue}>{order.address}</Text>
                </View>
              </View>
              <View className={styles.cardFooter}>
                {providerMode ? (
                  <>
                    <View>
                      <Text className={styles.priceLabel}>订单 ¥{order.price} · 你的收入 </Text>
                      <Text className={styles.priceValue}>¥{order.providerEarning || Math.round(order.price * 0.95)}</Text>
                    </View>
                    {providerScope === 'available' && order.status === 'pending' && (
                      <View className={styles.actionBtn} onClick={(e) => handleAccept(order, e)}>
                        <Text>立即接单</Text>
                      </View>
                    )}
                    {providerScope === 'mine' && order.status === 'accepted' && (
                      <View className={styles.actionBtn} onClick={(e) => handleStart(order, e)}>
                        <Text>开始服务</Text>
                      </View>
                    )}
                    {providerScope === 'mine' && order.status === 'inProgress' && (
                      <View className={`${styles.actionBtn} ${styles.completeBtn}`} onClick={(e) => handleComplete(order, e)}>
                        <Text>完成服务</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text className={styles.priceLabel}>订单金额</Text>
                    <Text className={styles.priceValue}>¥{order.price}</Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>{providerMode ? (providerScope === 'available' ? '🔔' : '📋') : '📋'}</Text>
          <Text className={styles.emptyText}>
            {providerMode ? (providerScope === 'available' ? '暂无可接订单' : '还没有接到订单') : '暂无订单'}
          </Text>
        </View>
      )}
    </View>
  )
}

export default OrdersPage

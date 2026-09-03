import React, { useState } from 'react'
import { View, Text, Input, Switch, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { addressService } from '@/services'
import { requireLogin } from '@/utils/auth'
import { Address } from '@/types'
import styles from './index.module.scss'

const TAGS = ['家', '公司', '学校', '其他']

const AddressesPage: React.FC = () => {
  const [list, setList] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [form, setForm] = useState({ contactName: '', phone: '', detail: '', tag: '家', isDefault: false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await addressService.list()
      setList(data)
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    if (!requireLogin()) return
    load()
  })

  const startNew = () => {
    setForm({ contactName: '', phone: '', detail: '', tag: '家', isDefault: false })
    setEditing('new')
  }

  const startEdit = (addr: Address) => {
    setForm({
      contactName: addr.contactName,
      phone: addr.phone,
      detail: addr.detail,
      tag: addr.tag || '其他',
      isDefault: addr.isDefault
    })
    setEditing(addr)
  }

  const handleDelete = (addr: Address) => {
    Taro.showModal({
      title: '提示',
      content: `确定删除「${addr.detail}」这个地址吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await addressService.remove(addr.id)
            Taro.showToast({ title: '已删除', icon: 'success' })
            load()
          } catch {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleSave = async () => {
    if (!form.contactName) { Taro.showToast({ title: '请输入联系人', icon: 'none' }); return }
    if (!form.phone || !/^1\d{10}$/.test(form.phone)) { Taro.showToast({ title: '请输入正确的手机号', icon: 'none' }); return }
    if (!form.detail) { Taro.showToast({ title: '请输入详细地址', icon: 'none' }); return }
    if (saving) return
    setSaving(true)
    try {
      if (editing === 'new') {
        await addressService.create(form)
      } else if (editing) {
        await addressService.update(editing.id, form)
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setEditing(null)
      load()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (editing !== null) {
    return (
      <View className={styles.page}>
        <View className={styles.formCard}>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>联系人</Text>
            <Input
              className={styles.fieldInput}
              placeholder='请输入联系人姓名'
              value={form.contactName}
              onInput={e => setForm({ ...form, contactName: e.detail.value })}
            />
          </View>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>联系电话</Text>
            <Input
              className={styles.fieldInput}
              type='number'
              placeholder='请输入手机号'
              maxlength={11}
              value={form.phone}
              onInput={e => setForm({ ...form, phone: e.detail.value })}
            />
          </View>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>详细地址</Text>
            <Input
              className={styles.fieldInput}
              placeholder='请输入详细地址'
              value={form.detail}
              onInput={e => setForm({ ...form, detail: e.detail.value })}
            />
          </View>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>标签</Text>
            <View className={styles.tagRow}>
              {TAGS.map(t => (
                <View
                  key={t}
                  className={`${styles.tagOption} ${form.tag === t ? styles.tagActive : ''}`}
                  onClick={() => setForm({ ...form, tag: t })}
                >
                  <Text>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className={styles.defaultRow}>
            <Text className={styles.fieldLabel}>设为默认地址</Text>
            <Switch
              checked={form.isDefault}
              color='#FF8C42'
              onChange={e => setForm({ ...form, isDefault: e.detail.value })}
            />
          </View>
        </View>
        <View className={styles.btnRow}>
          <Button className={styles.cancelBtn} onClick={() => setEditing(null)}>取消</Button>
          <Button className={styles.saveBtn} onClick={handleSave} loading={saving} disabled={saving}>保存</Button>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {loading ? (
        <View className={styles.empty}><Text>加载中...</Text></View>
      ) : list.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📍</Text>
          <Text className={styles.emptyText}>还没有地址</Text>
          <Text className={styles.emptyHint}>点击下方按钮新增地址</Text>
        </View>
      ) : (
        <ScrollView scrollY className={styles.list}>
          {list.map(addr => (
            <View key={addr.id} className={`${styles.card} ${addr.isDefault ? styles.cardDefault : ''}`}>
              <View className={styles.cardMain}>
                <View className={styles.cardHeader}>
                  <Text className={styles.contactName}>{addr.contactName}</Text>
                  <Text className={styles.contactPhone}>{addr.phone}</Text>
                  {addr.tag && <Text className={styles.tag}>{addr.tag}</Text>}
                  {addr.isDefault && <Text className={styles.defaultBadge}>默认</Text>}
                </View>
                <Text className={styles.detail}>{addr.detail}</Text>
              </View>
              <View className={styles.actions}>
                <Text className={styles.actionBtn} onClick={() => startEdit(addr)}>编辑</Text>
                <Text className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(addr)}>删除</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <Button className={styles.addBtn} onClick={startNew}>+ 新增地址</Button>
    </View>
  )
}

export default AddressesPage

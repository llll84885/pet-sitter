import React, { useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { providerService } from '@/services'
import { isProvider } from '@/utils/auth'
import styles from './index.module.scss'

const SKILLS = ['喂猫', '遛狗', '梳毛', '喂药', '眼部清洁', '直播', '代收快递']

const ProviderProfilePage: React.FC = () => {
  const [form, setForm] = useState({ nickname: '', bio: '', serviceArea: '', skills: [] as string[] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    try {
      const data = await providerService.getProfile()
      setForm({
        nickname: data.nickname || '',
        bio: data.bio || '',
        serviceArea: data.serviceArea || '',
        skills: data.skills || []
      })
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
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
    loadProfile()
  })

  const toggleSkill = (skill: string) => {
    setForm(prev => {
      const has = prev.skills.includes(skill)
      return {
        ...prev,
        skills: has ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
      }
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await providerService.updateProfile(form)
      Taro.showToast({ title: '保存成功', icon: 'success' })
      Taro.navigateBack()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}><Text>加载中...</Text></View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>昵称</Text>
          <Input
            className={styles.fieldInput}
            placeholder='请输入昵称'
            value={form.nickname}
            onInput={e => setForm({ ...form, nickname: e.detail.value })}
          />
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>个人简介</Text>
          <Textarea
            className={styles.textarea}
            placeholder='介绍一下你自己...'
            value={form.bio}
            onInput={e => setForm({ ...form, bio: e.detail.value })}
          />
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>服务区域</Text>
          <Input
            className={styles.fieldInput}
            placeholder='如：西陵区/伍家岗区'
            value={form.serviceArea}
            onInput={e => setForm({ ...form, serviceArea: e.detail.value })}
          />
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>服务技能</Text>
          <View className={styles.tagRow}>
            {SKILLS.map(s => (
              <View
                key={s}
                className={`${styles.tagOption} ${form.skills.includes(s) ? styles.active : ''}`}
                onClick={() => toggleSkill(s)}
              >
                <Text>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Button className={styles.saveBtn} onClick={handleSave} loading={saving} disabled={saving}>保存</Button>
    </View>
  )
}

export default ProviderProfilePage

import React, { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authService } from '@/services'
import { setToken, setCurrentUser } from '@/utils/auth'
import { UserRole } from '@/types'
import styles from './index.module.scss'

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState<UserRole>('customer')

  const handleSubmit = async () => {
    if (!phone || !/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (mode === 'register' && !nickname) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      const res = mode === 'login'
        ? await authService.login({ phone, password })
        : await authService.register({ phone, password, nickname, role })
      setToken(res.token)
      setCurrentUser(res.user)
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      setTimeout(() => {
        const pages = Taro.getCurrentPages()
        if (pages.length > 1) {
          Taro.navigateBack()
        } else {
          Taro.switchTab({ url: '/pages/mine/index' })
        }
      }, 1000)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.logo}>🐾</View>
      <Text className={styles.title}>萌宠管家</Text>
      <Text className={styles.subtitle}>{mode === 'login' ? '欢迎回来' : '创建你的账号'}</Text>

      <View className={styles.tabRow}>
        <View
          className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
          onClick={() => setMode('login')}
        >
          <Text>登录</Text>
        </View>
        <View
          className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
          onClick={() => setMode('register')}
        >
          <Text>注册</Text>
        </View>
      </View>

      <View className={styles.form}>
        {mode === 'register' && (
          <View className={styles.inputGroup}>
            <Text className={styles.label}>身份</Text>
            <View className={styles.roleRow}>
              <View
                className={`${styles.roleOption} ${role === 'customer' ? styles.active : ''}`}
                onClick={() => setRole('customer')}
              >
                <Text>我是顾客</Text>
              </View>
              <View
                className={`${styles.roleOption} ${role === 'provider' ? styles.active : ''}`}
                onClick={() => setRole('provider')}
              >
                <Text>我是服务人员</Text>
              </View>
            </View>
          </View>
        )}
        {mode === 'register' && (
          <View className={styles.inputGroup}>
            <Text className={styles.label}>昵称</Text>
            <Input
              className={styles.input}
              placeholder='请输入昵称'
              value={nickname}
              onInput={e => setNickname(e.detail.value)}
              maxlength={20}
            />
          </View>
        )}
        <View className={styles.inputGroup}>
          <Text className={styles.label}>手机号</Text>
          <Input
            className={styles.input}
            type='number'
            placeholder='请输入手机号'
            value={phone}
            onInput={e => setPhone(e.detail.value)}
            maxlength={11}
          />
        </View>
        <View className={styles.inputGroup}>
          <Text className={styles.label}>密码</Text>
          <Input
            className={styles.input}
            password
            placeholder='请输入密码（至少6位）'
            value={password}
            onInput={e => setPassword(e.detail.value)}
            maxlength={32}
          />
        </View>
      </View>

      <Button
        className={styles.submitBtn}
        onClick={handleSubmit}
        loading={submitting}
        disabled={submitting}
      >
        {mode === 'login' ? '登 录' : '注 册'}
      </Button>

      <Text className={styles.hint}>演示账号：顾客 13800000000 / 服务人员 13900000000，密码均 123456</Text>
    </View>
  )
}

export default LoginPage

import { AddOnItem } from '@/types'

// 喂猫升级项
export const CAT_ADDONS: AddOnItem[] = [
  { id: 'cat-comb', name: '梳毛', price: 3, description: '梳理浮毛，疏通小纠结', category: 'cat' },
  { id: 'cat-play', name: '陪玩互动', price: 3, description: '逗猫棒陪玩5-10分钟', category: 'cat' },
  { id: 'cat-medicine', name: '喂药/保健品', price: 3, description: '按要求喂药、化毛膏等', category: 'cat' },
  { id: 'cat-eye-clean', name: '眼/鼻清洁', price: 3, description: '擦泪痕、清理鼻周', category: 'cat' },
  { id: 'cat-water', name: '绿植浇水', price: 3, description: '帮家里花草浇水', category: 'both' },
  { id: 'cat-express-small', name: '代收快递(小件)', price: 3, description: '1-2件小件', category: 'both' },
  { id: 'cat-express-medium', name: '代收快递(中件)', price: 5, description: '3-5件', category: 'both' },
  { id: 'cat-express-large', name: '代收快递(大件)', price: 10, description: '6件以上/大件', category: 'both' },
  { id: 'cat-live', name: '全程直播', price: 10, description: '微信视频全程同步', category: 'both' }
]

// 遛狗升级项
export const DOG_ADDONS: AddOnItem[] = [
  { id: 'dog-extend-10', name: '延长遛狗10分钟', price: 2, description: '超出基础30分钟', category: 'dog' },
  { id: 'dog-extend-30', name: '延长遛狗30分钟', price: 6, description: '超出基础30分钟', category: 'dog' },
  { id: 'dog-comb', name: '梳毛', price: 3, description: '遛后梳理浮毛', category: 'dog' },
  { id: 'dog-wipe', name: '擦脚/擦身体', price: 5, description: '遛后清洁脚部、屁屁', category: 'dog' },
  { id: 'dog-play', name: '陪玩互动', price: 3, description: '抛球/飞盘游戏', category: 'dog' },
  { id: 'dog-medicine', name: '喂药/保健品', price: 3, description: '按要求喂药', category: 'dog' },
  { id: 'dog-water', name: '绿植浇水', price: 3, description: '帮家里花草浇水', category: 'both' },
  { id: 'dog-express-small', name: '代收快递(小件)', price: 3, description: '1-2件小件', category: 'both' },
  { id: 'dog-express-medium', name: '代收快递(中件)', price: 5, description: '3-5件', category: 'both' },
  { id: 'dog-express-large', name: '代收快递(大件)', price: 10, description: '6件以上/大件', category: 'both' },
  { id: 'dog-live', name: '全程直播', price: 10, description: '微信视频全程同步', category: 'both' }
]

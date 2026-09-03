import { Pet, Order } from '@/types'

// Mock宠物数据
export const MOCK_PETS: Pet[] = [
  {
    id: 'pet-1',
    name: '橘座',
    type: 'cat',
    breed: '中华田园猫',
    personality: '活泼粘人',
    notes: '喜欢逗猫棒，不洗澡'
  },
  {
    id: 'pet-2',
    name: '豆豆',
    type: 'cat',
    breed: '英短蓝猫',
    personality: '高冷慢热',
    notes: '胆小，生人勿近'
  },
  {
    id: 'pet-3',
    name: '大黄',
    type: 'dog',
    breed: '柯基',
    weight: 12,
    dogSize: 'small',
    personality: '热情友好',
    notes: '爱爆冲，牵绳要抓紧'
  },
  {
    id: 'pet-4',
    name: '奶茶',
    type: 'dog',
    breed: '金毛',
    weight: 28,
    dogSize: 'medium',
    personality: '温顺亲人',
    notes: '夏天怕热'
  }
]

// Mock订单数据
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1',
    serviceType: 'cat',
    serviceDate: '2026-09-05',
    serviceTime: '18:00-18:30',
    address: '宜昌市西陵区XX小区3栋201',
    distance: 2.5,
    pets: [MOCK_PETS[0], MOCK_PETS[1]],
    addOns: [{ id: 'cat-comb', name: '梳毛', price: 3, description: '梳理浮毛', category: 'cat' }],
    note: '两只猫都要梳毛，橘座比较配合',
    status: 'pending',
    price: 29,
    priceDetails: [
      { label: '上门喂猫 基础价', amount: 20 },
      { label: '多猫加价（2只）', amount: 5 },
      { label: '梳毛', amount: 3 },
      { label: '五一加价 ×1.15', amount: 1 }
    ],
    createdAt: '2026-09-02 10:30'
  },
  {
    id: 'ord-2',
    serviceType: 'dog',
    serviceDate: '2026-09-03',
    serviceTime: '19:00-19:40',
    address: '宜昌市伍家岗区XX花园5栋1502',
    distance: 4.2,
    pets: [MOCK_PETS[3]],
    addOns: [
      { id: 'dog-extend-10', name: '延长遛狗10分钟', price: 2, description: '超出基础30分钟', category: 'dog' },
      { id: 'dog-wipe', name: '擦脚/擦身体', price: 5, description: '遛后清洁', category: 'dog' }
    ],
    status: 'accepted',
    price: 35,
    priceDetails: [
      { label: '上门遛狗 基础价', amount: 25 },
      { label: '距离加价（4.2公里）', amount: 3 },
      { label: '延长遛狗10分钟', amount: 2 },
      { label: '擦脚/擦身体', amount: 5 }
    ],
    createdAt: '2026-09-01 15:20'
  },
  {
    id: 'ord-3',
    serviceType: 'cat',
    serviceDate: '2026-08-28',
    serviceTime: '20:00-20:30',
    address: '宜昌市点军区XX苑1栋301',
    distance: 1.8,
    pets: [MOCK_PETS[0]],
    addOns: [],
    status: 'completed',
    price: 20,
    priceDetails: [
      { label: '上门喂猫 基础价', amount: 20 }
    ],
    createdAt: '2026-08-27 09:15'
  },
  {
    id: 'ord-4',
    serviceType: 'dog',
    serviceDate: '2026-08-25',
    serviceTime: '17:30-18:10',
    address: '宜昌市西陵区XX小区2栋802',
    distance: 3.0,
    pets: [MOCK_PETS[2], MOCK_PETS[3]],
    addOns: [
      { id: 'dog-play', name: '陪玩互动', price: 3, description: '抛球游戏', category: 'dog' },
      { id: 'dog-live', name: '全程直播', price: 10, description: '微信视频全程同步', category: 'both' }
    ],
    status: 'completed',
    price: 51,
    priceDetails: [
      { label: '上门遛狗 基础价', amount: 25 },
      { label: '多狗加价（2只）', amount: 13 },
      { label: '陪玩互动', amount: 3 },
      { label: '全程直播', amount: 10 }
    ],
    createdAt: '2026-08-24 11:00'
  }
]

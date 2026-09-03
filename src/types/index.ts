// ============================================
// 类型定义
// ============================================

// 宠物类型
export type PetType = 'cat' | 'dog'

// 犬型分类
export type DogSize = 'small' | 'medium' | 'large'

// 服务类型
export type ServiceType = 'cat' | 'dog'

// 节假日类型
export type HolidayType = 'spring' | 'national' | 'midAutumn' | 'dragonBoat' | 'mayDay' | 'newYear' | 'qingming'

// 升级服务项
export interface AddOnItem {
  id: string
  name: string
  price: number
  description: string
  category: 'cat' | 'dog' | 'both'
}

// 宠物信息
export interface Pet {
  id: string
  name: string
  type: PetType
  breed: string
  weight?: number
  dogSize?: DogSize
  personality: string
  notes?: string
}

// 距离加价
export interface DistancePricing {
  distance: number
  extraFee: number
}

// 定价明细项
export interface PriceDetailItem {
  label: string
  amount: number
}

// 定价计算结果
export interface PriceResult {
  basePrice: number
  distanceFee: number
  petCountFee: number
  addOnsFee: number
  holidayFee: number
  totalPrice: number
  details: PriceDetailItem[]
}

// 订单状态
export type OrderStatus = 'pending' | 'accepted' | 'inProgress' | 'completed' | 'cancelled'

// 订单
export interface Order {
  id: string
  serviceType: ServiceType
  serviceDate: string
  serviceTime: string
  address: string
  distance: number
  pets: Pet[]
  addOns: AddOnItem[]
  note?: string
  status: OrderStatus
  price: number
  priceDetails: PriceDetailItem[]
  providerId?: string | null
  commission?: number
  providerEarning?: number
  createdAt: string
}

// 用户角色
export type UserRole = 'customer' | 'provider'

// 用户
export interface User {
  id: string
  phone: string
  nickname?: string
  role: UserRole
  bio?: string
  serviceArea?: string
  skills?: string[]
}

// 登录/注册返回
export interface AuthResult {
  user: User
  token: string
}

// 地址
export interface Address {
  id: string
  contactName: string
  phone: string
  detail: string
  tag?: string
  isDefault: boolean
}

// 服务人员收入统计
export interface ProviderEarnings {
  totalEarnings: number
  thisMonthEarnings: number
  pendingPayout: number
  commissionTotal: number
  completedCount: number
  acceptedCount: number
  inProgressCount: number
  totalCount: number
}

// 服务人员资料
export interface ProviderProfile {
  nickname?: string
  phone: string
  bio?: string
  serviceArea?: string
  skills: string[]
}

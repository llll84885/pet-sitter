import { ServiceType, AddOnItem, PriceResult, PriceDetailItem, Pet, DogSize } from '@/types'

// ============================================
// 定价配置常量
// ============================================

// 基础价
export const BASE_PRICE: Record<ServiceType, number> = {
  cat: 20,
  dog: 25
}

// 距离加价规则
export function calcDistanceFee(distanceKm: number): number {
  if (distanceKm <= 3) return 0
  if (distanceKm <= 5) return 3
  return 5
}

// 多宠加价
export function calcPetCountFee(pets: Pet[], serviceType: ServiceType): number {
  if (pets.length <= 1) return 0
  const extraCount = pets.length - 1
  let fee = 0
  if (serviceType === 'cat') {
    fee = extraCount * 5
  } else {
    for (let i = 1; i < pets.length; i++) {
      const pet = pets[i]
      if (pet.type === 'cat') {
        fee += 5
      } else {
        const size = pet.dogSize || 'small'
        const sizeFeeMap: Record<DogSize, number> = { small: 5, medium: 8, large: 10 }
        fee += sizeFeeMap[size]
      }
    }
  }
  return fee
}

// 升级项加价
export function calcAddOnsFee(addOns: AddOnItem[]): number {
  return addOns.reduce((sum, item) => sum + item.price, 0)
}

// 节假日加价系数
export function calcHolidayMultiplier(dateStr: string): number {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 春节：2月中旬
  if ((month === 1 && day >= 28) || (month === 2 && day <= 7)) return 1.4
  // 国庆：10.1-10.7
  if (month === 10 && day >= 1 && day <= 7) return 1.3
  // 中秋/端午：简化处理（9月中秋、6月端午）
  if ((month === 9 && day >= 15 && day <= 25) || (month === 6 && day >= 15 && day <= 25)) return 1.2
  // 五一：5.1-5.5
  if (month === 5 && day >= 1 && day <= 5) return 1.15
  // 元旦/清明：1.1-1.3、4.4-4.6
  if ((month === 1 && day >= 1 && day <= 3) || (month === 4 && day >= 4 && day <= 6)) return 1.1

  // 周末加价
  const weekday = date.getDay()
  if (weekday === 0 || weekday === 6) return 1 // 周末不涨价

  return 1 // 工作日原价
}

// 节假日名称
export function getHolidayName(dateStr: string): string {
  const multiplier = calcHolidayMultiplier(dateStr)
  if (multiplier === 1.4) return '春节'
  if (multiplier === 1.3) return '国庆'
  if (multiplier === 1.2) return '中秋/端午'
  if (multiplier === 1.15) return '五一'
  if (multiplier === 1.1) return '元旦/清明'
  return ''
}

// ============================================
// 主定价函数
// ============================================

export function calculatePrice(params: {
  serviceType: ServiceType
  distance: number
  pets: Pet[]
  addOns: AddOnItem[]
  date: string
}): PriceResult {
  const { serviceType, distance, pets, addOns, date } = params

  const basePrice = BASE_PRICE[serviceType]
  const distanceFee = calcDistanceFee(distance)
  const petCountFee = calcPetCountFee(pets, serviceType)
  const addOnsFee = calcAddOnsFee(addOns)

  // 先算出基础小计（不含节假日）
  const subtotal = basePrice + distanceFee + petCountFee + addOnsFee

  // 节假日系数
  const multiplier = calcHolidayMultiplier(date)
  const holidayFee = multiplier > 1 ? Math.round(subtotal * (multiplier - 1)) : 0
  const totalPrice = subtotal + holidayFee

  // 构建明细
  const details: PriceDetailItem[] = []
  details.push({ label: serviceType === 'cat' ? '上门喂猫 基础价' : '上门遛狗 基础价', amount: basePrice })

  if (distanceFee > 0) {
    details.push({ label: `距离加价（${distance.toFixed(1)}公里）`, amount: distanceFee })
  }

  if (petCountFee > 0) {
    const catCount = pets.filter(p => p.type === 'cat').length
    const dogCount = pets.filter(p => p.type === 'dog').length
    let label = '多宠加价'
    if (catCount > 0 && dogCount > 0) label = `多宠加价（${catCount}猫${dogCount}狗）`
    else if (catCount > 1) label = `多猫加价（${catCount}只）`
    else if (dogCount > 1) label = `多狗加价（${dogCount}只）`
    details.push({ label, amount: petCountFee })
  }

  if (addOns.length > 0) {
    addOns.forEach(item => {
      details.push({ label: item.name, amount: item.price })
    })
  }

  if (holidayFee > 0) {
    const holidayName = getHolidayName(date)
    details.push({ label: `${holidayName}加价 ×${multiplier}`, amount: holidayFee })
  }

  return {
    basePrice,
    distanceFee,
    petCountFee,
    addOnsFee,
    holidayFee,
    totalPrice,
    details
  }
}

// 遛狗延长时间加价
export function calcDogExtendFee(minutes: number): number {
  // 2元/10分钟
  return Math.ceil(minutes / 10) * 2
}

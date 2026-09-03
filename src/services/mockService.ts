// ============================================
// Mock 数据服务层：当后端不可用时自动降级
// ============================================
import { MOCK_PETS, MOCK_ORDERS } from '@/data/mock';
import { Pet, Order, PriceResult, User, Address, AuthResult, ProviderEarnings, ProviderProfile } from '@/types';
import { calculatePrice } from '@/utils/pricing';

// 用本地变量模拟可写的数据库
let petsStore: Pet[] = JSON.parse(JSON.stringify(MOCK_PETS));
let ordersStore: Order[] = JSON.parse(JSON.stringify(MOCK_ORDERS));

// Mock 用户 & 地址
let mockUsersStore: any[] = [
  { id: 'user-1', phone: '13800000000', password: '123456', nickname: '橘座铲屎官', role: 'customer', bio: '', serviceArea: '', skills: [] },
  { id: 'user-2', phone: '13900000000', password: '123456', nickname: '小王', role: 'provider', bio: '5年宠物护理经验', serviceArea: '宜昌市西陵区/伍家岗区', skills: ['cat','dog','梳毛','喂药'] }
];
let mockCurrentUserId: string | null = null;
let mockAddressesStore: Address[] = [
  { id: 'addr-1', contactName: '张三', phone: '13800000000', detail: '宜昌市西陵区XX小区3栋201', tag: '家', isDefault: true },
  { id: 'addr-2', contactName: '张三', phone: '13800000000', detail: '宜昌市伍家岗区XX花园5栋1502', tag: '公司', isDefault: false }
];

// ---------------- 宠物 ----------------
export const mockListPets = async (): Promise<Pet[]> => petsStore;

export const mockGetPet = async (id: string): Promise<Pet | undefined> => petsStore.find(p => p.id === id);

export const mockCreatePet = async (body: Partial<Pet>): Promise<Pet> => {
  const pet: Pet = {
    id: `pet-${Date.now()}`,
    name: body.name || '无名',
    type: body.type || 'cat',
    breed: body.breed || '',
    weight: body.weight,
    dogSize: body.dogSize,
    personality: body.personality || '',
    notes: body.notes
  };
  petsStore.unshift(pet);
  return pet;
};

export const mockUpdatePet = async (id: string, body: Partial<Pet>): Promise<Pet | undefined> => {
  const idx = petsStore.findIndex(p => p.id === id);
  if (idx >= 0) {
    petsStore[idx] = { ...petsStore[idx], ...body };
    return petsStore[idx];
  }
  return undefined;
};

export const mockDeletePet = async (id: string) => {
  petsStore = petsStore.filter(p => p.id !== id);
  return true;
};

// ---------------- 订单 ----------------
export const mockListOrders = async (params?: { status?: string }): Promise<Order[]> => {
  if (params?.status && params.status !== 'all') {
    return ordersStore.filter(o => o.status === params.status);
  }
  return ordersStore;
};

export const mockGetOrder = async (id: string): Promise<Order | undefined> => ordersStore.find(o => o.id === id);

export const mockCreateOrder = async (body: any): Promise<Order> => {
  const order: Order = {
    id: `ord-${Date.now()}`,
    serviceType: body.serviceType,
    serviceDate: body.serviceDate,
    serviceTime: body.serviceTime,
    address: body.address,
    distance: body.distance,
    pets: body.pets || [],
    addOns: body.addOns || [],
    note: body.note,
    status: 'pending',
    price: body.price,
    priceDetails: body.priceDetails || [],
    createdAt: new Date().toLocaleString('zh-CN')
  };
  ordersStore.unshift(order);
  return order;
};

export const mockUpdateOrderStatus = async (id: string, status: Order['status']): Promise<Order | undefined> => {
  const idx = ordersStore.findIndex(o => o.id === id);
  if (idx >= 0) {
    ordersStore[idx].status = status;
    return ordersStore[idx];
  }
  return undefined;
};

// ---------------- 定价 ----------------
export const mockCalcPrice = async (body: {
  serviceType: 'cat' | 'dog';
  distance: number;
  pets: Pet[];
  addOns: any[];
  date: string;
}): Promise<PriceResult> => {
  return calculatePrice(body);
};

// ---------------- 认证 ----------------
export const mockRegister = async (body: { phone: string; password: string; nickname?: string; role?: 'customer' | 'provider' }): Promise<AuthResult> => {
  if (mockUsersStore.find(u => u.phone === body.phone)) throw new Error('该手机号已注册');
  const id = `user-${Date.now()}`;
  const role = body.role || 'customer';
  const nick = body.nickname || (role === 'provider' ? '服务人员' : '铲屎官');
  const user = { id, phone: body.phone, password: body.password, nickname: nick, role, bio: '', serviceArea: '', skills: [] };
  mockUsersStore.push(user);
  mockCurrentUserId = id;
  return { user: { id, phone: body.phone, nickname: nick, role }, token: `mock-token-${id}` };
};

export const mockLogin = async (body: { phone: string; password: string }): Promise<AuthResult> => {
  const u = mockUsersStore.find(u => u.phone === body.phone && u.password === body.password);
  if (!u) throw new Error('手机号或密码错误');
  mockCurrentUserId = u.id;
  return { user: { id: u.id, phone: u.phone, nickname: u.nickname, role: u.role || 'customer' }, token: `mock-token-${u.id}` };
};

export const mockMe = async (): Promise<User> => {
  if (!mockCurrentUserId) throw new Error('未登录');
  const u = mockUsersStore.find(u => u.id === mockCurrentUserId);
  if (!u) throw new Error('未登录');
  return { id: u.id, phone: u.phone, nickname: u.nickname, role: u.role || 'customer', bio: u.bio, serviceArea: u.serviceArea, skills: u.skills };
};

// ---------------- 地址 ----------------
export const mockListAddresses = async (): Promise<Address[]> => {
  if (!mockCurrentUserId) return [];
  return mockAddressesStore.filter(a => a.id); // 返回所有（mock 单用户）
};

export const mockCreateAddress = async (body: Omit<Address, 'id'>): Promise<Address> => {
  if (body.isDefault) mockAddressesStore.forEach(a => { a.isDefault = false; });
  const addr: Address = { ...body, id: `addr-${Date.now()}` };
  mockAddressesStore.unshift(addr);
  return addr;
};

export const mockUpdateAddress = async (id: string, body: Partial<Address>): Promise<Address> => {
  const idx = mockAddressesStore.findIndex(a => a.id === id);
  if (idx < 0) throw new Error('地址不存在');
  if (body.isDefault) mockAddressesStore.forEach(a => { a.isDefault = false; });
  mockAddressesStore[idx] = { ...mockAddressesStore[idx], ...body };
  return mockAddressesStore[idx];
};

export const mockDeleteAddress = async (id: string): Promise<boolean> => {
  mockAddressesStore = mockAddressesStore.filter(a => a.id !== id);
  return true;
};

// ---------------- 服务人员 ----------------
export const mockListProviderOrders = async (params: { scope: 'available' | 'mine'; status?: string }): Promise<Order[]> => {
  if (params.scope === 'available') {
    return ordersStore.filter(o => o.status === 'pending');
  }
  let list = ordersStore.filter(o => (o as any).providerId === mockCurrentUserId);
  if (params.status && params.status !== 'all') {
    list = list.filter(o => o.status === params.status);
  }
  return list;
};

export const mockAcceptOrder = async (id: string): Promise<Order> => {
  const idx = ordersStore.findIndex(o => o.id === id);
  if (idx < 0) throw new Error('订单不存在');
  const commission = Math.round(ordersStore[idx].price * 0.05);
  ordersStore[idx] = {
    ...ordersStore[idx],
    providerId: mockCurrentUserId || '',
    status: 'accepted',
    commission,
    providerEarning: ordersStore[idx].price - commission
  };
  return ordersStore[idx];
};

export const mockGetEarnings = async (): Promise<ProviderEarnings> => {
  const mine = ordersStore.filter(o => (o as any).providerId === mockCurrentUserId);
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let totalEarnings = 0, thisMonthEarnings = 0, pendingPayout = 0, commissionTotal = 0;
  let completedCount = 0, acceptedCount = 0, inProgressCount = 0;
  mine.forEach(o => {
    if (o.status === 'completed') {
      totalEarnings += o.providerEarning || 0;
      commissionTotal += o.commission || 0;
      completedCount++;
      if (o.createdAt && o.createdAt.startsWith(ym)) thisMonthEarnings += o.providerEarning || 0;
    }
    if (o.status === 'accepted') { pendingPayout += o.providerEarning || 0; acceptedCount++; }
    if (o.status === 'inProgress') { pendingPayout += o.providerEarning || 0; inProgressCount++; }
  });
  return { totalEarnings, thisMonthEarnings, pendingPayout, commissionTotal, completedCount, acceptedCount, inProgressCount, totalCount: mine.length };
};

export const mockGetProviderProfile = async (): Promise<ProviderProfile> => {
  const u = mockUsersStore.find(u => u.id === mockCurrentUserId);
  if (!u) throw new Error('未登录');
  return { nickname: u.nickname, phone: u.phone, bio: u.bio, serviceArea: u.serviceArea, skills: u.skills || [] };
};

export const mockUpdateProviderProfile = async (body: Partial<ProviderProfile>): Promise<ProviderProfile> => {
  const u = mockUsersStore.find(u => u.id === mockCurrentUserId);
  if (!u) throw new Error('未登录');
  if (body.nickname !== undefined) u.nickname = body.nickname;
  if (body.bio !== undefined) u.bio = body.bio;
  if (body.serviceArea !== undefined) u.serviceArea = body.serviceArea;
  if (body.skills !== undefined) u.skills = body.skills;
  return { nickname: u.nickname, phone: u.phone, bio: u.bio, serviceArea: u.serviceArea, skills: u.skills };
};

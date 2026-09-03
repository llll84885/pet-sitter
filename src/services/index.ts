// ============================================
// 业务服务层：宠物 / 订单 / 定价
// 所有页面统一通过这里获取数据，无需关心后端是否在线
// ============================================

import { request } from './request';
import {
  mockListPets, mockGetPet, mockCreatePet, mockUpdatePet, mockDeletePet,
  mockListOrders, mockGetOrder, mockCreateOrder, mockUpdateOrderStatus,
  mockCalcPrice,
  mockRegister, mockLogin, mockMe,
  mockListAddresses, mockCreateAddress, mockUpdateAddress, mockDeleteAddress,
  mockListProviderOrders, mockAcceptOrder, mockGetEarnings, mockGetProviderProfile, mockUpdateProviderProfile
} from './mockService';
import { Pet, Order, PriceResult, User, Address, AuthResult, ProviderEarnings, ProviderProfile, UserRole } from '@/types';

// ---------------- 宠物 ----------------
export const petService = {
  list: (): Promise<Pet[]> => request({
    url: '/api/pets',
    mockFn: () => mockListPets()
  }),

  get: (id: string): Promise<Pet> => request({
    url: `/api/pets/${id}`,
    mockFn: () => mockGetPet(id)
  }),

  create: (body: Partial<Pet>): Promise<Pet> => request({
    url: '/api/pets',
    method: 'POST',
    data: body,
    mockFn: (d) => mockCreatePet(d || body)
  }),

  update: (id: string, body: Partial<Pet>): Promise<Pet> => request({
    url: `/api/pets/${id}`,
    method: 'PUT',
    data: body,
    mockFn: (d) => mockUpdatePet(id, d || body)
  }),

  remove: (id: string): Promise<{ ok: boolean }> => request({
    url: `/api/pets/${id}`,
    method: 'DELETE',
    mockFn: () => mockDeletePet(id).then(r => ({ ok: !!r }))
  })
};

// ---------------- 订单 ----------------
export const orderService = {
  list: (params?: { status?: string }): Promise<Order[]> => request({
    url: params?.status && params.status !== 'all'
      ? `/api/orders?status=${params.status}`
      : '/api/orders',
    mockFn: () => mockListOrders(params)
  }),

  get: (id: string): Promise<Order> => request({
    url: `/api/orders/${id}`,
    mockFn: () => mockGetOrder(id)
  }),

  create: (body: {
    serviceType: 'cat' | 'dog';
    serviceDate: string;
    serviceTime: string;
    address: string;
    distance: number;
    petIds: string[];
    pets?: Pet[]; // 仅 mock 用
    addOns: any[];
    note?: string;
    price: number;
    priceDetails: { label: string; amount: number }[];
  }): Promise<Order> => request({
    url: '/api/orders',
    method: 'POST',
    data: body,
    mockFn: (d) => mockCreateOrder(d || body)
  }),

  updateStatus: (id: string, status: Order['status']): Promise<Order> => request({
    url: `/api/orders/${id}/status`,
    method: 'PUT',
    data: { status },
    mockFn: () => mockUpdateOrderStatus(id, status)
  })
};

// ---------------- 定价 ----------------
export const priceService = {
  calc: (body: {
    serviceType: 'cat' | 'dog';
    distance: number;
    pets: Pet[];
    addOns: any[];
    date: string;
  }): Promise<PriceResult> => request({
    url: '/api/price/calc',
    method: 'POST',
    data: body,
    mockFn: (d) => mockCalcPrice(d || body)
  })
};

// ---------------- 认证 ----------------
export const authService = {
  register: (body: { phone: string; password: string; nickname?: string; role?: UserRole }): Promise<AuthResult> =>
    request({
      url: '/api/auth/register',
      method: 'POST',
      data: body,
      mockFn: () => mockRegister(body)
    }),

  login: (body: { phone: string; password: string }): Promise<AuthResult> =>
    request({
      url: '/api/auth/login',
      method: 'POST',
      data: body,
      mockFn: () => mockLogin(body)
    }),

  me: (): Promise<User> =>
    request({
      url: '/api/auth/me',
      mockFn: () => mockMe()
    }),
};

// ---------------- 地址 ----------------
export const addressService = {
  list: (): Promise<Address[]> =>
    request({
      url: '/api/addresses',
      mockFn: () => mockListAddresses()
    }),

  create: (body: Omit<Address, 'id'>): Promise<Address> =>
    request({
      url: '/api/addresses',
      method: 'POST',
      data: body,
      mockFn: () => mockCreateAddress(body)
    }),

  update: (id: string, body: Partial<Address>): Promise<Address> =>
    request({
      url: `/api/addresses/${id}`,
      method: 'PUT',
      data: body,
      mockFn: () => mockUpdateAddress(id, body)
    }),

  remove: (id: string): Promise<{ ok: boolean }> =>
    request({
      url: `/api/addresses/${id}`,
      method: 'DELETE',
      mockFn: () => mockDeleteAddress(id).then(() => ({ ok: true }))
    }),
};

// ---------------- 服务人员 ----------------
export const providerService = {
  listOrders: (params: { scope: 'available' | 'mine'; status?: string }): Promise<Order[]> =>
    request({
      url: `/api/provider/orders?scope=${params.scope}${params.status ? `&status=${params.status}` : ''}`,
      mockFn: () => mockListProviderOrders(params)
    }),

  accept: (id: string): Promise<Order> =>
    request({
      url: `/api/orders/${id}/accept`,
      method: 'PUT',
      mockFn: () => mockAcceptOrder(id)
    }),

  getEarnings: (): Promise<ProviderEarnings> =>
    request({
      url: '/api/provider/earnings',
      mockFn: () => mockGetEarnings()
    }),

  getProfile: (): Promise<ProviderProfile> =>
    request({
      url: '/api/provider/profile',
      mockFn: () => mockGetProviderProfile()
    }),

  updateProfile: (body: Partial<ProviderProfile>): Promise<ProviderProfile> =>
    request({
      url: '/api/provider/profile',
      method: 'PUT',
      data: body,
      mockFn: () => mockUpdateProviderProfile(body)
    }),
};

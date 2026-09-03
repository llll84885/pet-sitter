// ============================================
// 通用 HTTP 请求封装：Taro.request / fetch(H5)
// 失败时自动降级到 Mock
// ============================================

import Taro from '@tarojs/taro';
import { API_BASE, FORCE_MOCK } from './config';
import { getToken } from '@/utils/auth';

// 统一的请求参数
export interface RequestOptions {
  url: string;      // 路径，如 /api/pets
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  /** 对应的 mock 降级函数：(data?) => Promise<any> */
  mockFn?: (data?: any) => Promise<any>;
}

// Taro 环境判断：H5 用 fetch，其他用 Taro.request
async function taroFetch<T = any>({ url, method = 'GET', data }: { url: string; method?: string; data?: any }) {
  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  if ((env as any).TARO_ENV === 'h5') {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: (data && method !== 'GET') ? JSON.stringify(data) : undefined
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }
  const res = await Taro.request<T>({
    url,
    method,
    data,
    header: { 'Content-Type': 'application/json', ...authHeader },
    timeout: 8000
  });
  if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode}`);
  return res.data as T;
}

/**
 * 通用请求方法
 * - 有 mockFn 且 FORCE_MOCK = true：直接走 mock
 * - 真实请求失败时，若提供了 mockFn，则降级返回 mock 数据
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, mockFn } = options;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  // 强制 mock
  if (FORCE_MOCK && mockFn) {
    console.info('[request] FORCE_MOCK → 使用 Mock 数据', url);
    return (await mockFn(data)) as T;
  }

  try {
    const result = await taroFetch<{ ok: boolean; data: T; msg?: string }>({ url: fullUrl, method, data });
    if (result && result.ok && 'data' in result) {
      return result.data as T;
    }
    if (result && !result.ok) throw new Error(result.msg || '请求失败');
    return result as unknown as T;
  } catch (err) {
    console.warn(`[request] 后端请求失败 → ${fullUrl}`, err);
    if (mockFn) {
      console.info('[request] 降级使用 Mock 数据', url);
      return (await mockFn(data)) as T;
    }
    throw err;
  }
}

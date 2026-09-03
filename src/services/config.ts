// ============================================
// 配置：后端 API 地址 + 是否走 Mock
// ============================================

// 后端服务地址。开发期本地运行：http://localhost:3000
// 部署到公网时修改此地址或通过环境变量注入
const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const rawBase = (env as any).TARO_APP_API_BASE;
// 'same-origin'：H5 构建产物与后端部署在同一服务，请求走相对路径
// 未设置时默认本地开发地址
export const API_BASE = !rawBase
  ? 'http://localhost:3000'
  : (rawBase === 'same-origin' ? '' : rawBase);

// 切换开关：true 时强制使用 Mock（即使后端未启动）
export const FORCE_MOCK = false;

// SvelteFireAuth - Firebase Auth REST API Library for Svelte
// 客户端导出

// 类型定义
export type * from './types/index.js';

// 客户端功能
export { authStore, user, authenticated, loading, error } from './client/store.js';
export {
  signUp,
  signIn,
  signOut,
  sendEmailVerification,
  sendPasswordReset,
  updateProfile,
  updatePassword,
  updateEmail,
  deleteAccount
} from './client/auth.js';

// 工具函数（客户端安全的）
export {
  parseToken,
  isTokenExpired,
  createFirebaseError,
  handleFirebaseError,
  isValidEmail,
  isValidPassword,
  formatTimestamp,
  formatRelativeTime,
  generateAvatarURL,
  getUserDisplayName
} from './utils/index.js';

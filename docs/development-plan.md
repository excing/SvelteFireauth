# SvelteFireauth 开发方案与计划

## 项目概述

SvelteFireauth 是一个 Svelte 库，用于简化 Firebase Authentication 的集成。它提供后端 API 代理和前端认证状态管理功能。

**重要提醒**: 这是一个 Svelte Library 项目，不是 Svelte App。所有设计和实现必须考虑第三方开发者的使用场景。

## 技术架构设计

### 1. 项目结构

```
src/lib/
├── index.ts                          # 主入口，导出所有公共 API
├── client/                           # 客户端功能
│   ├── index.ts                      # 客户端导出
│   ├── auth-client.ts                # Firebase Auth REST API 客户端
│   ├── auth-store.ts                 # 认证状态管理 (Svelte Store)
│   └── types.ts                      # 客户端类型定义
├── server/                           # 服务端功能
│   ├── index.ts                      # 服务端导出
│   ├── auth-handler.ts               # 认证请求处理器
│   ├── hooks.ts                      # SvelteKit hooks 集成
│   ├── route-handlers.ts             # 路由处理函数
│   ├── session.ts                    # Session 管理（可选）
│   └── types.ts                      # 服务端类型定义
├── shared/                           # 共享代码
│   ├── types.ts                      # 共享类型定义
│   ├── constants.ts                  # 常量定义
│   └── utils.ts                      # 工具函数
└── types/                            # 全局类型定义
    └── firebase-auth.ts              # Firebase Auth API 类型
```

### 2. 核心功能模块

#### 2.1 服务端模块

**A. Hooks 集成 (一键集成方式)**
- `createAuthHandle(config)`: 创建 SvelteKit handle 函数
- 配置选项:
  - `firebaseApiKey`: Firebase API Key (必需)
  - `apiPath`: API 路径前缀 (默认: `/api/auth`)
  - `enableCallback`: 是否启用回调处理 (默认: true)
  - `callbackPath`: 回调路径 (默认: `__/auth/action`)
  - `enableSession`: 是否启用 Session (默认: false)
  - `sessionConfig`: Session 配置
  - `responseTransformer`: 自定义响应转换器

**B. 路由处理器 (手动集成方式)**
- `handleSignUp`: 注册处理器
- `handleSignIn`: 登录处理器
- `handleSignOut`: 登出处理器
- `handleRefreshToken`: 刷新令牌处理器
- `handlePasswordReset`: 密码重置处理器
- `handleEmailVerification`: 邮箱验证处理器
- `handleAuthCallback`: 认证回调处理器

**C. Session 管理 (可选)**
- `createSession`: 创建 Session
- `verifySession`: 验证 Session
- `destroySession`: 销毁 Session

#### 2.2 客户端模块

**A. Auth Client**
- `FirebaseAuthClient`: Firebase Auth REST API 客户端类
  - `signUp(email, password)`: 注册
  - `signIn(email, password)`: 登录
  - `signOut()`: 登出
  - `refreshToken()`: 刷新令牌
  - `resetPassword(email)`: 重置密码
  - `verifyEmail(oobCode)`: 验证邮箱
  - `updateProfile(data)`: 更新用户信息
  - `deleteAccount()`: 删除账户

**B. Auth Store**
- `authStore`: Svelte Store 管理认证状态
  - `user`: 当前用户信息
  - `loading`: 加载状态
  - `error`: 错误信息
  - `isAuthenticated`: 是否已认证

**C. 代理模式支持**
- 支持直接调用 Firebase REST API
- 支持通过后端代理调用

#### 2.3 路由保护

- `createAuthGuard(config)`: 创建路由保护中间件
- 配置选项:
  - `protectedRoutes`: 需要保护的路由列表
  - `redirectTo`: 未认证时重定向路径
  - `publicRoutes`: 公开路由列表

### 3. Firebase Auth REST API 端点映射

| 功能 | Firebase API | 本地代理路径 |
|------|-------------|-------------|
| 注册 | `/accounts:signUp` | `POST /api/auth/signup` |
| 登录 | `/accounts:signInWithPassword` | `POST /api/auth/signin` |
| 刷新令牌 | `/token` | `POST /api/auth/refresh` |
| 获取用户信息 | `/accounts:lookup` | `GET /api/auth/user` |
| 更新用户信息 | `/accounts:update` | `PUT /api/auth/user` |
| 删除账户 | `/accounts:delete` | `DELETE /api/auth/user` |
| 发送密码重置邮件 | `/accounts:sendOobCode` | `POST /api/auth/password-reset` |
| 确认密码重置 | `/accounts:resetPassword` | `POST /api/auth/password-confirm` |
| 发送验证邮件 | `/accounts:sendOobCode` | `POST /api/auth/verify-email` |
| 确认邮箱验证 | `/accounts:update` | `POST /api/auth/verify-email-confirm` |

## 开发计划

### Phase 1: 基础架构搭建 (预计 2-3 小时)

#### Task 1.1: 项目结构和类型定义
- [ ] 创建目录结构
- [ ] 定义 Firebase Auth API 类型
- [ ] 定义共享类型和常量
- [ ] 配置 TypeScript 导出路径

#### Task 1.2: 工具函数和常量
- [ ] 实现 Firebase API URL 构建工具
- [ ] 实现错误处理工具
- [ ] 定义 API 端点常量
- [ ] 实现请求/响应转换工具

### Phase 2: 服务端核心功能 (预计 4-5 小时)

#### Task 2.1: 基础 API 处理器
- [ ] 实现注册处理器 (handleSignUp)
- [ ] 实现登录处理器 (handleSignIn)
- [ ] 实现令牌刷新处理器 (handleRefreshToken)
- [ ] 实现用户信息获取处理器

#### Task 2.2: 高级 API 处理器
- [ ] 实现密码重置处理器
- [ ] 实现邮箱验证处理器
- [ ] 实现用户信息更新处理器
- [ ] 实现账户删除处理器

#### Task 2.3: Hooks 集成
- [ ] 实现 createAuthHandle 函数
- [ ] 实现路由匹配逻辑
- [ ] 实现请求分发逻辑
- [ ] 实现响应转换器支持

#### Task 2.4: 回调处理
- [ ] 实现认证回调处理器
- [ ] 支持邮箱验证回调
- [ ] 支持密码重置回调
- [ ] 支持自定义回调逻辑

### Phase 3: 客户端核心功能 (预计 3-4 小时)

#### Task 3.1: Auth Client 实现
- [ ] 实现 FirebaseAuthClient 基础类
- [ ] 实现注册/登录方法
- [ ] 实现令牌管理
- [ ] 实现用户信息管理方法

#### Task 3.2: Auth Store 实现
- [ ] 创建 Svelte Store
- [ ] 实现状态管理逻辑
- [ ] 实现自动令牌刷新
- [ ] 实现持久化存储 (localStorage)

#### Task 3.3: 代理模式支持
- [ ] 实现直接 API 调用模式
- [ ] 实现代理 API 调用模式
- [ ] 实现模式切换逻辑

### Phase 4: 高级功能 (预计 3-4 小时)

#### Task 4.1: Session 管理 (可选)
- [ ] 设计 Session 接口
- [ ] 实现 Session 创建
- [ ] 实现 Session 验证
- [ ] 集成 Firebase Admin SDK (可选依赖)

#### Task 4.2: 路由保护
- [ ] 实现 createAuthGuard 函数
- [ ] 实现路由匹配逻辑
- [ ] 实现重定向逻辑
- [ ] 支持自定义验证逻辑

#### Task 4.3: 响应自定义
- [ ] 实现响应转换器接口
- [ ] 实现默认转换器
- [ ] 支持自定义数据结构
- [ ] 实现错误格式化

### Phase 5: 测试和文档 (预计 4-5 小时)

#### Task 5.1: 单元测试
- [ ] 服务端处理器测试
- [ ] 客户端 API 测试
- [ ] Store 状态管理测试
- [ ] 工具函数测试

#### Task 5.2: 集成测试
- [ ] 创建示例应用
- [ ] 测试 Hooks 集成
- [ ] 测试手动集成
- [ ] 测试路由保护

#### Task 5.3: 文档编写
- [ ] API 文档
- [ ] 使用指南
- [ ] 配置说明
- [ ] 示例代码

### Phase 6: 优化和发布 (预计 2-3 小时)

#### Task 6.1: 代码优化
- [ ] 性能优化
- [ ] 代码审查
- [ ] 类型检查
- [ ] 打包优化

#### Task 6.2: 发布准备
- [ ] 更新 README
- [ ] 更新 package.json
- [ ] 添加 LICENSE
- [ ] 准备发布说明

## 技术决策

### 1. 依赖管理
- **核心依赖**: 无 (仅 peer dependencies: svelte, @sveltejs/kit)
- **可选依赖**: firebase-admin (仅在使用 Session 功能时)
- **开发依赖**: 已有的 TypeScript, Vite 等

### 2. API 设计原则
- 简单易用: 提供一键集成方式
- 灵活可扩展: 支持手动集成和自定义
- 类型安全: 完整的 TypeScript 类型定义
- 零配置: 合理的默认值

### 3. 错误处理策略
- 统一错误格式
- 详细错误信息
- 支持自定义错误处理
- 错误日志记录 (可选)

### 4. 安全考虑
- API Key 仅在服务端使用
- 令牌安全存储
- CSRF 保护 (通过 SvelteKit)
- Session 安全 (如果启用)

## 验收标准

### 功能完整性
- ✅ 所有核心 API 功能实现
- ✅ Hooks 一键集成可用
- ✅ 手动集成方式可用
- ✅ 客户端状态管理正常
- ✅ 路由保护功能正常

### 代码质量
- ✅ TypeScript 类型检查通过
- ✅ 无 ESLint 错误
- ✅ 代码格式规范
- ✅ 注释完整

### 测试覆盖
- ✅ 核心功能单元测试
- ✅ 集成测试通过
- ✅ 示例应用可运行

### 文档完整性
- ✅ API 文档完整
- ✅ 使用示例清晰
- ✅ 配置说明详细
- ✅ README 更新

## 风险和挑战

1. **Firebase API 变更**: 需要关注 Firebase API 更新
2. **类型定义复杂**: Firebase API 类型定义较复杂
3. **Session 管理**: Firebase Admin SDK 集成可能增加复杂度
4. **浏览器兼容性**: 需要考虑不同浏览器的存储 API

## 下一步行动

1. 创建详细的 API 设计文档
2. 开始 Phase 1 开发
3. 逐步实现各个功能模块
4. 持续测试和验证
5. 完善文档和示例


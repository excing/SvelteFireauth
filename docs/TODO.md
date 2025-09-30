# SvelteFireauth
这是一个用于用户认证的 Svelte 库.
后端代理 Google firebase auth rest api, 参考文档: `https://cloud.google.com/identity-platform/docs/use-rest-api?hl=zh-cn`

## 本 svelte 库提供
- 提供后端 API 一键集成
- 为前端提供 API 调用函数
  - 支持原生 firebase auth rest api 请求
  - 支持代理 API 请求.
- 为前端提供用户认证状态管理
- 后端默认提供firebase认证回调处理, 默认回调路由: `__/auth/actoin`, 可关闭此功能, 由调用者实现.
- 提供为指定路由一键集成的统一的路由认证功能.

## 提供后端 API 一键集成, 有两种方式:
1) 通过 hooks.server.ts 自定义路由一行代码集成, 类似 `createAuthHandle(firebaesApiKey, path)`, 调用者提供`firebaesApiKey, path`, `path` 默认值为 `/api/auth`.
2) 通过提供 API 对应的 `(GET | POST ): RequestHandler` 等处理函数手动快速集成, 更加灵活.

## 集成后端高级功能:
- 可自定义 API 响应数据结构, 默认返回原生 firebase auth rest api 响应数据.
- 可自定义 API 响应 Session, 默认不启用 Session, 如果启用 session, 则默认使用 Firebase admin sdk 包生成的 session.

注意: 此项目为 svelte library 项目, 是提供给第三方开发者使用的, 并非一个 svelte app, 在设计和开发时, 需要时刻关注这一点, 不要引入 svelte app 的功能或特征.
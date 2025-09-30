这是一个用于用户认证的 Svelte 库.
后端代理 Google firebase auth rest api, 参考文档: `https://cloud.google.com/identity-platform/docs/use-rest-api?hl=zh-cn`
负责提供后端 API 和 API 调用函数 ( 包括原生 firebase auth rest api 请求和代理 API 请求).
提供后端 API 一键集成, 有两种方式:
1) 通过 hooks.server.ts 自定义路由一行代码集成
2) 通过提供 API 对应的 GET/POST 等处理函数手动快速集成, 更加灵活.

每次对话都需要生成回顾, 总结和文档, 以及更新 README.md.
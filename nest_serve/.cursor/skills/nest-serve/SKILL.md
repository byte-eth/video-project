---
name: nest-serve
description: >-
  NestJS 10 + TypeORM (MySQL) + JWT 管理后台 API 的开发约定与架构。
  在 nest_serve 仓库内实现功能、加路由、改鉴权/序列化/DTO 时使用；
  或在同类技术栈（ConfigModule、全局 Guard、class-validator、SerializeInterceptor）的 Nest 项目中沿用相同模式时使用。
---

# nest-serve 栈约定

## 技术栈与入口

- **框架**: NestJS 10，Express，`src/main.ts` 启动；默认端口 `ConfigService.get('PORT')` 或 **3006**。
- **数据**: TypeORM + **mysql2**；`entities`  glob：`src/**/*.entity{.ts,.js}`；**非生产** `synchronize: true` 且打日志。
- **配置**: `ConfigModule.forRoot({ isGlobal: true })`，环境变量驱动 DB 与 JWT。
- **路径别名**: 一律用 `@/` 指向 `src/`（见 `tsconfig.json` paths），勿写深层相对路径。

## 目录与模块边界

| 区域 | 用途 |
|------|------|
| `src/auth/` | 认证控制器与服务；DTO 在 `auth/dto/` |
| `src/users/` | 用户 CRUD 查询；`users/dto/`；依赖 `User` 实体 |
| `src/entities/` | TypeORM 实体，文件名 `*.entity.ts` |
| `src/guards/` | 全局 `AuthGuard`（`APP_GUARD`） |
| `src/common/decorators/` | `@Public()` 元数据，放行无需 JWT 的路由 |
| `src/config/` | `jwt.config.ts` 等可复用配置对象 |
| `src/filters/` | 全局 `HttpExceptionFilter` |
| `src/interceptors/` | 全局 `SerializeInterceptor` |
| `src/middleware/` | Express 风格中间件（如 CSRF） |

新功能优先 **按领域建 module**（`*.module.ts` + `controller` + `service`），在 `app.module.ts` `imports` 注册。

## 全局管道 / 拦截器 / 过滤器（main.ts）

- **ValidationPipe**: `whitelist: true`、`transform: true` — DTO 用 `class-validator`；未声明字段会自动剥离。
- **SerializeInterceptor**: 使用 `class-transformer` 的 `instanceToPlain(..., { excludeExtraneousValues: true })`。要让字段出现在 JSON 中，响应类/DTO/实体导出字段需配合 **`@Expose()`**（否则可能被裁成空对象）。
- **HttpExceptionFilter**: 统一 `HttpException` 响应形状：`statusCode`、`timestamp`、`path`、`error`。

## 鉴权模型

- **全局守卫**: `AppModule` 注册 `APP_GUARD` → `AuthGuard`。
- **公开路由**: 在 handler 或 class 上加 `@Public()`（`SetMetadata('isPublic', true)`）。
- **受保护路由**: 默认需 `Authorization: Bearer <token>`；当前仓库里 `verifyToken` 为占位实现，扩展时应接入 `JwtService.verify` 或与 Passport 策略对齐。
- **用户控制器**: `UsersController` 另加了 `@UseGuards(AuthGuard)`（与全局 guard 叠加时注意行为一致即可）。

JWT：`JwtModule.registerAsync` / `register` 均使用 `jwt.config.ts`；`JWT_SECRET`、`JWT_EXPIRES_IN`（默认 `1h`）来自环境变量。

## CSRF 与安全中间件

- **helmet**、**cookie-parser**、**express-rate-limit**（15 分钟 / IP / 100 次）在 `main.ts` 挂载。
- **csrf**（`csrf.middleware.ts`）：**仅当 `NODE_ENV === 'production'`** 执行校验；开发环境直接 `next()`。
- `AppModule.configure` 对 `csrfMiddleware` 绑定 `forRoutes('*')`；`exclude` 里登录/注册排除项目前注释掉，改路由时注意生产环境 CSRF 与前端 cookie/头（`XSRF-TOKEN`）的配合。

## HTTPS（生产）

`NODE_ENV === 'production'` 时从 `secrets/private-key.pem` 与 `secrets/certificate.pem` 读证书，以 HTTPS 监听端口。

## 当前 HTTP 路由（前缀无全局 `api`，与 `@Controller` 一致）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/auth/hello` | 公开，健康/示例 |
| POST | `/auth/login` | 公开，`LoginDto` |
| POST | `/auth/register` | 公开，`CreateUserDto` |
| GET | `/users/:id` | 需认证（按 Guard 逻辑） |

## 实体与用户服务约定

- **User**（`user.entity.ts`）：`@BeforeInsert` 用 **bcrypt** 哈希密码；`validatePassword` 用于登录校验。
- **注册**: `UsersService.create` 为每个用户生成 **RSA 密钥对**（`publicKey` / `privateKey` 存入库）；注意私钥敏感，序列化层应默认不向客户端暴露（配合 `@Expose` 取舍或专用响应 DTO）。

## 扩展新接口时的检查清单

1. 是否需要 **公开**：是则 `@Public()`，否则确保客户端带有效 JWT（并完善 Guard 内校验）。
2. 入参是否新建 **DTO** 并加 `class-validator` 装饰器。
3. 响应若依赖实体且使用全局 **SerializeInterceptor**，字段是否标了 **`@Expose()`**。
4. 新表：加 `*.entity.ts`，必要时跑迁移或依赖非生产 `synchronize`。
5. 生产环境是否受 **CSRF** 影响：POST/PUT/PATCH/DELETE 需按中间件约定传 token。
6. 模块：`TypeOrmModule.forFeature([...])`、`exports` 中导出供其他模块使用的 service。

## 环境变量（常见）

- `PORT`、`NODE_ENV`
- `DB_HOST`、`DB_PORT`、`DB_USERNAME`、`DB_PASSWORD`、`DB_NAME`
- `JWT_SECRET`、`JWT_EXPIRES_IN`

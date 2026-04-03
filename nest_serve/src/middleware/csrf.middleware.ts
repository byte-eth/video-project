import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';

// 根据环境变量动态配置 CSRF（开发环境宽松，生产环境严格）
const isProduction = process.env.NODE_ENV === 'production';

const csrfProtection = csurf({
  cookie: {
    httpOnly: false, // 开发环境允许读取 cookie（必须设为 false，否则无法提取 XSRF-TOKEN）
    secure: isProduction, // 开发环境用 HTTP，设为 false；生产环境用 HTTPS，设为 true
    sameSite: isProduction ? 'strict' : 'lax', // 开发环境放宽 sameSite 限制
    maxAge: 900000, // 令牌有效期 15 分钟（可选）
  },
});

export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 在非生产环境跳过CSRF验证
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // @ts-ignore 对所有请求启用 CSRF 保护（包括 GET，确保能生成令牌）
  csrfProtection(req, res, (err) => {
    if (err) {
      console.error('CSRF 中间件错误:', err.message);
      return res.status(403).json({
        statusCode: 403,
        message: 'CSRF 验证失败',
        error: err.message,
      });
    }
    // 对 GET 请求，主动设置 XSRF-TOKEN 到 cookie（关键）
    if (req.method === 'GET') {
      res.cookie('XSRF-TOKEN', req.csrfToken());
    }
    next();
  });
}
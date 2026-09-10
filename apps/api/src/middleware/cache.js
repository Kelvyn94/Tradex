// apps/api/src/middleware/cache.js
const cache = new Map();

/**
 * Express Middleware for In-Memory GET Caching
 * @param {number} ttlSeconds - Time-To-Live in seconds (Default: 1 Hour)
 */
export const cacheMiddleware = (ttlSeconds = 3600) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl || req.url;
    const cachedItem = cache.get(key);

    if (cachedItem && cachedItem.expiry > Date.now()) {
      return res.status(200).json(cachedItem.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        cache.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

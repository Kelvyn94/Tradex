// apps/api/src/middleware/cache.js
const cache = new Map();

/**
 * In-Memory Caching Middleware for Express
 * @param {number} ttlSeconds - Duration in seconds to cache responses (default: 1 hour)
 */
const cacheMiddleware = (ttlSeconds = 3600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = req.originalUrl || req.url;
    const cachedItem = cache.get(key);

    // Return cached response if valid
    if (cachedItem && cachedItem.expiry > Date.now()) {
      return res.status(200).json(cachedItem.data);
    }

    // Intercept res.json to store the response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 200 responses
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

module.exports = cacheMiddleware;

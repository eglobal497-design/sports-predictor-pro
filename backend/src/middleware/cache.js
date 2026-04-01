const cacheManager = require('../utils/cacheManager');

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cacheManager.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send function
    const originalSend = res.json;
    res.json = function (data) {
      cacheManager.set(key, data, duration);
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = cacheMiddleware;
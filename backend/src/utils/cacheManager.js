const NodeCache = require('node-cache');

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 600
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl = 1800) {
    this.cache.set(key, value, ttl);
  }

  del(key) {
    this.cache.del(key);
  }

  flush() {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

module.exports = new CacheManager();
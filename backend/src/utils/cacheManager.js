const NodeCache = require('node-cache');
const config = require('../config');

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkPeriod
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl = config.cache.ttl) {
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
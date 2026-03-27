/**
 * AI协作开发系统v2.0 - 缓存服务
 * 基于Redis的分布式缓存服务
 */

const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.prefix = 'ai_collab:';
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const options = {
          socket: {
            host: config.redis.host,
            port: config.redis.port,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis重连失败次数过多');
                return new Error('Redis连接失败');
              }
              return Math.min(retries * 100, 3000);
            }
          }
        };
        
        if (config.redis.password) {
          options.password = config.redis.password;
        }
        
        this.client = redis.createClient(options);
        
        // 连接事件监听
        this.client.on('connect', () => {
          logger.info('🔗 Redis连接中...');
        });
        
        this.client.on('ready', () => {
          this.isConnected = true;
          logger.info('✅ Redis已连接并准备好');
          
          // 选择数据库
          if (config.redis.db !== 0) {
            this.client.select(config.redis.db, (err) => {
              if (err) {
                logger.warn('Redis选择数据库失败:', err);
              } else {
                logger.info(`✅ Redis已切换到数据库 ${config.redis.db}`);
              }
            });
          }
          
          resolve();
        });
        
        this.client.on('error', (err) => {
          logger.error('❌ Redis错误:', err);
          this.isConnected = false;
          
          // 仅在初始连接时拒绝
          if (!this.isConnected) {
            reject(err);
          }
        });
        
        this.client.on('end', () => {
          logger.warn('🔌 Redis连接已断开');
          this.isConnected = false;
        });
        
        this.client.on('reconnecting', () => {
          logger.info('🔄 Redis正在重新连接...');
        });
        
        // 连接到Redis
        this.client.connect();
        
      } catch (error) {
        logger.error('Redis连接异常:', error);
        reject(error);
      }
    });
  }
  
  // 生成带前缀的键
  getKey(key) {
    return `${this.prefix}${key}`;
  }
  
  // 字符串操作
  
  async set(key, value, ttl = null) {
    try {
      const cacheKey = this.getKey(key);
      
      if (ttl) {
        await this.client.set(cacheKey, JSON.stringify(value), {
          EX: ttl // 过期时间（秒）
        });
      } else {
        await this.client.set(cacheKey, JSON.stringify(value));
      }
      
      return true;
    } catch (error) {
      logger.error('Redis设置值失败:', error);
      return false;
    }
  }
  
  async get(key) {
    try {
      const cacheKey = this.getKey(key);
      const value = await this.client.get(cacheKey);
      
      if (value) {
        return JSON.parse(value);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis获取值失败:', error);
      return null;
    }
  }
  
  async delete(key) {
    try {
      const cacheKey = this.getKey(key);
      await this.client.del(cacheKey);
      return true;
    } catch (error) {
      logger.error('Redis删除键失败:', error);
      return false;
    }
  }
  
  async exists(key) {
    try {
      const cacheKey = this.getKey(key);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Redis检查键存在失败:', error);
      return false;
    }
  }
  
  async increment(key, amount = 1) {
    try {
      const cacheKey = this.getKey(key);
      return await this.client.incrBy(cacheKey, amount);
    } catch (error) {
      logger.error('Redis递增失败:', error);
      return null;
    }
  }
  
  async decrement(key, amount = 1) {
    try {
      const cacheKey = this.getKey(key);
      return await this.client.decrBy(cacheKey, amount);
    } catch (error) {
      logger.error('Redis递减失败:', error);
      return null;
    }
  }
  
  // 哈希操作
  
  async hset(hashKey, field, value) {
    try {
      const cacheKey = this.getKey(hashKey);
      await this.client.hSet(cacheKey, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis哈希设置失败:', error);
      return false;
    }
  }
  
  async hget(hashKey, field) {
    try {
      const cacheKey = this.getKey(hashKey);
      const value = await this.client.hGet(cacheKey, field);
      
      if (value) {
        return JSON.parse(value);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis哈希获取失败:', error);
      return null;
    }
  }
  
  async hgetall(hashKey) {
    try {
      const cacheKey = this.getKey(hashKey);
      const hash = await this.client.hGetAll(cacheKey);
      
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error('Redis获取所有哈希字段失败:', error);
      return {};
    }
  }
  
  async hdel(hashKey, field) {
    try {
      const cacheKey = this.getKey(hashKey);
      await this.client.hDel(cacheKey, field);
      return true;
    } catch (error) {
      logger.error('Redis哈希删除失败:', error);
      return false;
    }
  }
  
  async hexists(hashKey, field) {
    try {
      const cacheKey = this.getKey(hashKey);
      return await this.client.hExists(cacheKey, field);
    } catch (error) {
      logger.error('Redis哈希检查字段存在失败:', error);
      return false;
    }
  }
  
  // 列表操作
  
  async lpush(listKey, value) {
    try {
      const cacheKey = this.getKey(listKey);
      return await this.client.lPush(cacheKey, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis列表左推失败:', error);
      return null;
    }
  }
  
  async rpush(listKey, value) {
    try {
      const cacheKey = this.getKey(listKey);
      return await this.client.rPush(cacheKey, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis列表右推失败:', error);
      return null;
    }
  }
  
  async lpop(listKey) {
    try {
      const cacheKey = this.getKey(listKey);
      const value = await this.client.lPop(cacheKey);
      
      if (value) {
        return JSON.parse(value);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis列表左弹出失败:', error);
      return null;
    }
  }
  
  async rpop(listKey) {
    try {
      const cacheKey = this.getKey(listKey);
      const value = await this.client.rPop(cacheKey);
      
      if (value) {
        return JSON.parse(value);
      }
      
      return null;
    } catch (error) {
      logger.error('Redis列表右弹出失败:', error);
      return null;
    }
  }
  
  async lrange(listKey, start = 0, end = -1) {
    try {
      const cacheKey = this.getKey(listKey);
      const values = await this.client.lRange(cacheKey, start, end);
      
      return values.map(value => JSON.parse(value));
    } catch (error) {
      logger.error('Redis获取列表范围失败:', error);
      return [];
    }
  }
  
  async llen(listKey) {
    try {
      const cacheKey = this.getKey(listKey);
      return await this.client.lLen(cacheKey);
    } catch (error) {
      logger.error('Redis获取列表长度失败:', error);
      return 0;
    }
  }
  
  // 集合操作
  
  async sadd(setKey, value) {
    try {
      const cacheKey = this.getKey(setKey);
      return await this.client.sAdd(cacheKey, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis集合添加失败:', error);
      return null;
    }
  }
  
  async srem(setKey, value) {
    try {
      const cacheKey = this.getKey(setKey);
      return await this.client.sRem(cacheKey, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis集合删除失败:', error);
      return null;
    }
  }
  
  async smembers(setKey) {
    try {
      const cacheKey = this.getKey(setKey);
      const values = await this.client.sMembers(cacheKey);
      
      return values.map(value => JSON.parse(value));
    } catch (error) {
      logger.error('Redis获取集合成员失败:', error);
      return [];
    }
  }
  
  async sismember(setKey, value) {
    try {
      const cacheKey = this.getKey(setKey);
      return await this.client.sIsMember(cacheKey, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis检查集合成员失败:', error);
      return false;
    }
  }
  
  // 有序集合操作
  
  async zadd(zsetKey, score, value) {
    try {
      const cacheKey = this.getKey(zsetKey);
      return await this.client.zAdd(cacheKey, {
        score,
        value: JSON.stringify(value)
      });
    } catch (error) {
      logger.error('Redis有序集合添加失败:', error);
      return null;
    }
  }
  
  async zrange(zsetKey, start = 0, end = -1, withScores = false) {
    try {
      const cacheKey = this.getKey(zsetKey);
      const options = withScores ? { WITHSCORES: true } : {};
      
      const result = await this.client.zRange(cacheKey, start, end, options);
      
      if (withScores) {
        const items = [];
        for (let i = 0; i < result.length; i += 2) {
          items.push({
            value: JSON.parse(result[i]),
            score: parseFloat(result[i + 1])
          });
        }
        return items;
      } else {
        return result.map(value => JSON.parse(value));
      }
    } catch (error) {
      logger.error('Redis获取有序集合范围失败:', error);
      return withScores ? [] : [];
    }
  }
  
  async zrevrange(zsetKey, start = 0, end = -1, withScores = false) {
    try {
      const cacheKey = this.getKey(zsetKey);
      const options = withScores ? { WITHSCORES: true } : {};
      
      const result = await this.client.zRevRange(cacheKey, start, end, options);
      
      if (withScores) {
        const items = [];
        for (let i = 0; i < result.length; i += 2) {
          items.push({
            value: JSON.parse(result[i]),
            score: parseFloat(result[i + 1])
          });
        }
        return items;
      } else {
        return result.map(value => JSON.parse(value));
      }
    } catch (error) {
      logger.error('Redis获取有序集合反向范围失败:', error);
      return withScores ? [] : [];
    }
  }
  
  // 过期时间操作
  
  async expire(key, ttl) {
    try {
      const cacheKey = this.getKey(key);
      return await this.client.expire(cacheKey, ttl);
    } catch (error) {
      logger.error('Redis设置过期时间失败:', error);
      return false;
    }
  }
  
  async ttl(key) {
    try {
      const cacheKey = this.getKey(key);
      return await this.client.ttl(cacheKey);
    } catch (error) {
      logger.error('Redis获取剩余时间失败:', error);
      return -2; // 键不存在
    }
  }
  
  async persist(key) {
    try {
      const cacheKey = this.getKey(key);
      return await this.client.persist(cacheKey);
    } catch (error) {
      logger.error('Redis移除过期时间失败:', error);
      return false;
    }
  }
  
  // 批量操作
  
  async mset(items) {
    try {
      const pipeline = this.client.multi();
      
      Object.entries(items).forEach(([key, value]) => {
        const cacheKey = this.getKey(key);
        pipeline.set(cacheKey, JSON.stringify(value));
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis批量设置失败:', error);
      return false;
    }
  }
  
  async mget(keys) {
    try {
      const cacheKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mGet(cacheKeys);
      
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Redis批量获取失败:', error);
      return keys.map(() => null);
    }
  }
  
  // 发布/订阅
  
  async publish(channel, message) {
    try {
      const cacheKey = this.getKey(channel);
      return await this.client.publish(cacheKey, JSON.stringify(message));
    } catch (error) {
      logger.error('Redis发布消息失败:', error);
      return 0;
    }
  }
  
  subscribe(channel, callback) {
    try {
      const cacheKey = this.getKey(channel);
      
      this.client.subscribe(cacheKey, (message) => {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          logger.error('Redis订阅消息解析失败:', error);
        }
      });
      
      logger.info(`✅ 已订阅Redis频道: ${channel}`);
    } catch (error) {
      logger.error('Redis订阅失败:', error);
    }
  }
  
  unsubscribe(channel) {
    try {
      const cacheKey = this.getKey(channel);
      this.client.unsubscribe(cacheKey);
      logger.info(`✅ 已取消订阅Redis频道: ${channel}`);
    } catch (error) {
      logger.error('Redis取消订阅失败:', error);
    }
  }
  
  // 缓存模式
  
  async cached(key, fetchFunction, ttl = 300) {
    // 先从缓存获取
    const cachedValue = await this.get(key);
    
    if (cachedValue !== null) {
      logger.debug(`缓存命中: ${key}`);
      return cachedValue;
    }
    
    // 缓存未命中，从数据源获取
    logger.debug(`缓存未命中: ${key}`);
    const freshValue = await fetchFunction();
    
    // 存入缓存
    if (freshValue !== null && freshValue !== undefined) {
      await this.set(key, freshValue, ttl);
    }
    
    return freshValue;
  }
  
  async rateLimit(key, limit, windowSeconds) {
    try {
      const cacheKey = this.getKey(`ratelimit:${key}`);
      const current = await this.get(cacheKey);
      
      if (current === null) {
        // 首次请求
        await this.set(cacheKey, 1, windowSeconds);
        return { allowed: true, remaining: limit - 1, reset: windowSeconds };
      }
      
      if (current >= limit) {
        // 超过限制
        const ttl = await this.ttl(`ratelimit:${key}`);
        return { allowed: false, remaining: 0, reset: ttl };
      }
      
      // 增加计数
      await this.increment(cacheKey);
      const newCount = current + 1;
      const remaining = limit - newCount;
      
      return { allowed: true, remaining, reset: windowSeconds };
    } catch (error) {
      logger.error('速率限制检查失败:', error);
      // 出错时允许请求
      return { allowed: true, remaining: limit, reset: windowSeconds };
    }
  }
  
  // 会话管理
  
  async createSession(sessionId, userData, ttl = 3600) {
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
      ...userData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    await this.set(sessionKey, sessionData, ttl);
    return sessionId;
  }
  
  async getSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    return await this.get(sessionKey);
  }
  
  async updateSessionActivity(sessionId, ttl = 3600) {
    const sessionKey = `session:${sessionId}`;
    const session = await this.get(sessionKey);
    
    if (session) {
      session.lastActivity = Date.now();
      await this.set(sessionKey, session, ttl);
      return true;
    }
    
    return false;
  }
  
  async deleteSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    return await this.delete(sessionKey);
  }
  
  // 协作会话缓存
  
  async cacheSessionParticipants(sessionId, participants) {
    const cacheKey = `session_participants:${sessionId}`;
    await this.set(cacheKey, participants, 300); // 5分钟缓存
  }
  
  async getSessionParticipants(sessionId) {
    const cacheKey = `session_participants:${sessionId}`;
    return await this.get(cacheKey);
  }
  
  async cacheProjectFiles(projectId, files) {
    const cacheKey = `project_files:${projectId}`;
    await this.set(cacheKey, files, 600); // 10分钟缓存
  }
  
  async getProjectFiles(projectId) {
    const cacheKey = `project_files:${projectId}`;
    return await this.get(cacheKey);
  }
  
  async invalidateProjectCache(projectId) {
    const cacheKey = `project_files:${projectId}`;
    await this.delete(cacheKey);
  }
  
  // 系统状态
  
  async getStatus() {
    try {
      const info = await this.client.info();
      const memory = await this.client.info('memory');
      const stats = await this.client.info('stats');
      
      return {
        connected: this.isConnected,
        version: info.split('\n').find(line => line.startsWith('redis_version:'))?.split(':')[1]?.trim(),
        uptime: info.split('\n').find(line => line.startsWith('uptime_in_seconds:'))?.split(':')[1]?.trim(),
        connected_clients: info.split('\n').find(line => line.startsWith('connected_clients:'))?.split(':')[1]?.trim(),
        used_memory: memory.split('\n').find(line => line.startsWith('used_memory:'))?.split(':')[1]?.trim(),
        total_commands_processed: stats.split('\n').find(line => line.startsWith('total_commands_processed:'))?.split(':')[1]?.trim()
      };
    } catch (error) {
      logger.error('获取Redis状态失败:', error);
      return {
        connected: this.isConnected,
        error: error.message
      };
    }
  }
  
  // 清理缓存
  
  async clearCache(pattern = 'ai_collab:*') {
    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`🧹 清理了 ${keys.length} 个缓存键`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error('清理缓存失败:', error);
      return 0;
    }
  }
  
  async clearPattern(pattern) {
    try {
      const fullPattern = this.getKey(pattern);
      return await this.clearCache(fullPattern);
    } catch (error) {
      logger.error('按模式清理缓存失败:', error);
      return 0;
    }
  }
  
  // 断开连接
  
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('✅ Redis连接已关闭');
      } catch (error) {
        logger.error('Redis关闭连接失败:', error);
      }
    }
  }
  
  // 检查连接状态
  
  isConnected() {
    return this.isConnected;
  }
}

module.exports = CacheService;
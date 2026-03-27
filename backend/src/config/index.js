/**
 * AI协作开发系统v2.0 - 配置文件
 */

const path = require('path');
const fs = require('fs');

// 确保必要的目录存在
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 基础目录
const baseDir = path.join(__dirname, '../..');
const dataDir = path.join(baseDir, 'data');
const uploadsDir = path.join(baseDir, 'uploads');
const logsDir = path.join(baseDir, 'logs');
const backupsDir = path.join(baseDir, 'backups');

// 创建目录
ensureDirectoryExists(dataDir);
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(logsDir);
ensureDirectoryExists(backupsDir);

const config = {
  // 服务器配置
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 4000,
    host: process.env.HOST || 'localhost',
    baseUrl: process.env.BASE_URL || 'http://localhost:4000'
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-this'
  },
  
  // 数据库配置
  database: {
    dialect: 'sqlite',
    path: process.env.DATABASE_PATH || path.join(dataDir, 'collaboration.db'),
    storage: process.env.DATABASE_PATH || path.join(dataDir, 'collaboration.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // Redis缓存配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },
  
  // 文件上传配置
  upload: {
    path: uploadsDir,
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,text/plain,text/markdown').split(',')
  },
  
  // WebSocket配置
  websocket: {
    path: process.env.WS_PATH || '/socket.io',
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 60000,
    pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
    maxHttpBufferSize: parseInt(process.env.WS_MAX_HTTP_BUFFER_SIZE, 10) || 1e6
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: logsDir,
    maxSize: parseInt(process.env.LOG_MAX_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 30
  },
  
  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  
  // AI代理配置
  ai: {
    agentCount: parseInt(process.env.AI_AGENT_COUNT, 10) || 4,
    maxConcurrentTasks: parseInt(process.env.AI_MAX_CONCURRENT_TASKS, 10) || 3,
    taskTimeoutMs: parseInt(process.env.AI_TASK_TIMEOUT_MS, 10) || 5 * 60 * 1000 // 5分钟
  },
  
  // 监控配置
  monitoring: {
    enabled: process.env.METRICS_ENABLED === 'true',
    port: parseInt(process.env.PROMETHEUS_PORT, 10) || 9090
  },
  
  // 邮件配置
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'noreply@aicollab.com'
  },
  
  // 路径配置
  paths: {
    base: baseDir,
    data: dataDir,
    uploads: uploadsDir,
    logs: logsDir,
    backups: backupsDir,
    src: path.join(baseDir, 'src'),
    public: path.join(baseDir, 'public'),
    templates: path.join(baseDir, 'templates')
  },
  
  // 功能开关
  features: {
    realtimeCollaboration: true,
    codeReview: true,
    automatedTesting: true,
    gitIntegration: true,
    performanceMonitoring: true
  }
};

// 开发环境特定配置
if (config.server.env === 'development') {
  config.database.logging = console.log;
  config.logging.level = 'debug';
  config.features.realtimeCollaboration = true;
  
  // 开发环境AI代理较少
  config.ai.agentCount = 2;
  config.ai.maxConcurrentTasks = 2;
}

// 测试环境特定配置
if (config.server.env === 'test') {
  config.database.path = path.join(dataDir, 'test.db');
  config.database.storage = path.join(dataDir, 'test.db');
  config.logging.level = 'warn';
  config.features.realtimeCollaboration = false;
}

// 生产环境特定配置
if (config.server.env === 'production') {
  config.database.logging = false;
  config.logging.level = 'info';
  config.security.jwtSecret = process.env.JWT_SECRET;
  config.rateLimit.maxRequests = 50;
  
  // 生产环境需要设置邮件
  if (!config.email.host || !config.email.user || !config.email.pass) {
    console.warn('⚠️  生产环境需要配置邮件服务');
  }
}

// 验证必要配置
const validateConfig = () => {
  const errors = [];
  
  if (!config.security.jwtSecret || config.security.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
    errors.push('JWT_SECRET必须设置且不能使用默认值');
  }
  
  if (config.server.env === 'production') {
    if (config.cors.origin === 'http://localhost:3000') {
      errors.push('生产环境必须设置正确的CORS_ORIGIN');
    }
    
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      errors.push('生产环境必须配置Redis');
    }
  }
  
  return errors;
};

const validationErrors = validateConfig();
if (validationErrors.length > 0) {
  console.error('❌ 配置验证失败:');
  validationErrors.forEach(error => console.error(`  - ${error}`));
  
  if (config.server.env === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  开发环境继续运行，但生产环境需要修复这些问题');
  }
}

module.exports = config;
/**
 * AI协作开发系统v2.0 - 数据库服务
 * 基于SQLite的关系型数据库服务
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.dbPath = config.database.path;
    this.backupDir = config.paths.backups;
    
    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // 确保数据库文件存在
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        
        // 打开数据库连接
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            logger.error('数据库连接失败:', err);
            reject(err);
            return;
          }
          
          logger.info(`✅ 数据库已连接: ${this.dbPath}`);
          this.isConnected = true;
          
          // 启用外键约束和WAL模式
          this.db.run('PRAGMA foreign_keys = ON');
          this.db.run('PRAGMA journal_mode = WAL');
          this.db.run('PRAGMA synchronous = NORMAL');
          this.db.run('PRAGMA cache_size = -2000'); // 2MB缓存
          
          // 初始化数据库表
          this.initializeTables()
            .then(() => {
              logger.info('✅ 数据库表初始化完成');
              resolve();
            })
            .catch(initErr => {
              logger.error('数据库表初始化失败:', initErr);
              reject(initErr);
            });
        });
        
        // 监听数据库错误
        this.db.on('error', (err) => {
          logger.error('数据库错误:', err);
          this.isConnected = false;
        });
        
      } catch (error) {
        logger.error('数据库连接异常:', error);
        reject(error);
      }
    });
  }
  
  async initializeTables() {
    return new Promise((resolve, reject) => {
      try {
        // 开始事务
        this.db.run('BEGIN TRANSACTION');
        
        // 1. 用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'active',
            avatar_url TEXT,
            preferences TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP
          )
        `);
        
        // 2. AI代理表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ai_agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            model TEXT,
            capabilities TEXT DEFAULT '{}',
            status TEXT DEFAULT 'available',
            current_load INTEGER DEFAULT 0,
            max_load INTEGER DEFAULT 5,
            performance_metrics TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 3. 项目表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            owner_id TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            visibility TEXT DEFAULT 'private',
            settings TEXT DEFAULT '{}',
            progress INTEGER DEFAULT 0,
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
          )
        `);
        
        // 4. 项目成员表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS project_members (
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        // 5. 任务表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'todo',
            priority INTEGER DEFAULT 3,
            type TEXT DEFAULT 'development',
            assigned_to TEXT,
            created_by TEXT,
            estimated_time INTEGER,
            actual_time INTEGER,
            due_date TIMESTAMP,
            dependencies TEXT DEFAULT '[]',
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `);
        
        // 6. 代码文件表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS code_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            path TEXT NOT NULL,
            filename TEXT NOT NULL,
            content TEXT,
            language TEXT,
            hash TEXT,
            version INTEGER DEFAULT 1,
            created_by TEXT,
            updated_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id),
            UNIQUE(project_id, path)
          )
        `);
        
        // 7. 代码变更历史
        this.db.run(`
          CREATE TABLE IF NOT EXISTS code_changes (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL,
            version INTEGER NOT NULL,
            content TEXT,
            changes TEXT,
            author_id TEXT NOT NULL,
            commit_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (file_id) REFERENCES code_files(id) ON DELETE CASCADE,
            FOREIGN KEY (author_id) REFERENCES users(id)
          )
        `);
        
        // 8. 协作会话表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS collaboration_sessions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            settings TEXT DEFAULT '{}',
            created_by TEXT NOT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `);
        
        // 9. 会话参与者表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS session_participants (
            session_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'participant',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            left_at TIMESTAMP,
            PRIMARY KEY (session_id, user_id),
            FOREIGN KEY (session_id) REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        // 10. 聊天消息表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'text',
            attachments TEXT DEFAULT '[]',
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_by TEXT DEFAULT '[]',
            FOREIGN KEY (session_id) REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id)
          )
        `);
        
        // 11. 知识库表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS knowledge_base (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT,
            tags TEXT DEFAULT '[]',
            language TEXT,
            examples TEXT DEFAULT '[]',
            created_by TEXT,
            updated_by TEXT,
            views INTEGER DEFAULT 0,
            helpful_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
          )
        `);
        
        // 12. 系统日志表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS system_logs (
            id TEXT PRIMARY KEY,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            source TEXT,
            user_id TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
        
        // 13. 审计日志表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            details TEXT DEFAULT '{}',
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
        
        // 14. 文件附件表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS file_attachments (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            path TEXT NOT NULL,
            uploader_id TEXT NOT NULL,
            related_type TEXT,
            related_id TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploader_id) REFERENCES users(id)
          )
        `);
        
        // 创建索引以提高查询性能
        this.createIndexes();
        
        // 提交事务
        this.db.run('COMMIT', (err) => {
          if (err) {
            logger.error('数据库初始化提交失败:', err);
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            logger.info('✅ 数据库初始化完成');
            resolve();
          }
        });
        
      } catch (error) {
        logger.error('数据库初始化异常:', error);
        this.db.run('ROLLBACK');
        reject(error);
      }
    });
  }
  
  createIndexes() {
    // 用户相关索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    
    // 项目相关索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)');
    
    // 任务相关索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
    
    // 代码相关索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_code_files_project ON code_files(project_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_code_files_path ON code_files(path)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_code_changes_file ON code_changes(file_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_code_changes_author ON code_changes(author_id)');
    
    // 协作相关索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_project ON collaboration_sessions(project_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_status ON collaboration_sessions(status)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_participants_session ON session_participants(session_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_participants_user ON session_participants(user_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at)');
    
    // 知识库索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base(tags)');
    
    // 日志索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
    
    // 文件附件索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_files_uploader ON file_attachments(uploader_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_files_related ON file_attachments(related_type, related_id)');
  }
  
  // 通用查询方法
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.db.all(sql, params, (err, rows) => {
        const duration = Date.now() - startTime;
        
        if (err) {
          logger.databaseLogger.logError(err, sql, params);
          reject(err);
        } else {
          if (config.database.logging) {
            logger.databaseLogger.logQuery(sql, params, duration);
          }
          resolve(rows);
        }
      });
    });
  }
  
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.db.run(sql, params, function(err) {
        const duration = Date.now() - startTime;
        
        if (err) {
          logger.databaseLogger.logError(err, sql, params);
          reject(err);
        } else {
          if (config.database.logging) {
            logger.databaseLogger.logQuery(sql, params, duration);
          }
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
  
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.db.get(sql, params, (err, row) => {
        const duration = Date.now() - startTime;
        
        if (err) {
          logger.databaseLogger.logError(err, sql, params);
          reject(err);
        } else {
          if (config.database.logging) {
            logger.databaseLogger.logQuery(sql, params, duration);
          }
          resolve(row);
        }
      });
    });
  }
  
  // 事务支持
  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }
  
  async commitTransaction() {
    return this.run('COMMIT');
  }
  
  async rollbackTransaction() {
    return this.run('ROLLBACK');
  }
  
  async withTransaction(callback) {
    try {
      await this.beginTransaction();
      const result = await callback();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }
  
  // 数据备份
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.db`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // 使用SQLite的备份API
      const backupDb = new sqlite3.Database(backupFile);
      this.db.backup(backupDb, {
        step: (pages) => {
          logger.debug(`备份进度: ${pages} 页`);
        },
        finish: () => {
          const duration = Date.now() - startTime;
          const size = fs.statSync(backupFile).size;
          
          backupDb.close();
          
          logger.systemLogger.logBackup('full', size, duration);
          logger.info(`✅ 数据库备份完成: ${backupFile} (${Math.round(size / 1024)}KB)`);
          
          // 清理旧备份（保留最近7天）
          this.cleanupOldBackups();
          
          resolve({ file: backupFile, size, duration });
        },
        error: (err) => {
          backupDb.close();
          logger.error('数据库备份失败:', err);
          reject(err);
        }
      });
    });
  }
  
  cleanupOldBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(this.backupDir, file),
        time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // 按时间倒序排列
    
    // 删除7天前的备份
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    files.forEach((file, index) => {
      if (file.time < sevenDaysAgo) {
        fs.unlinkSync(file.path);
        logger.info(`🗑️  删除旧备份: ${file.name}`);
      }
    });
  }
  
  // 数据清理
  async cleanupOldData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // 清理旧的系统日志（保留30天）
      await this.run(`
        DELETE FROM system_logs 
        WHERE created_at < ?
      `, [thirtyDaysAgo]);
      
      // 清理旧的审计日志（保留30天）
      await this.run(`
        DELETE FROM audit_logs 
        WHERE created_at < ?
      `, [thirtyDaysAgo]);
      
      // 清理已结束的会话（30天前）
      await this.run(`
        DELETE FROM collaboration_sessions 
        WHERE status = 'ended' AND ended_at < ?
      `, [thirtyDaysAgo]);
      
      logger.info('✅ 旧数据清理完成');
    } catch (error) {
      logger.error('❌ 旧数据清理失败:', error);
      throw error;
    }
  }
  
  // 数据库状态检查
  async checkStatus() {
    try {
      const tables = await this.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `);
      
      const tableCount = tables.length;
      const totalRows = await this.get('SELECT COUNT(*) as count FROM (SELECT 1 FROM sqlite_master WHERE type="table")');
      const dbSize = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0;
      
      return {
        connected: this.isConnected,
        tables: tableCount,
        totalRows: totalRows.count,
        size: dbSize,
        path: this.dbPath,
        lastBackup: this.getLastBackupTime()
      };
    } catch (error) {
      logger.error('数据库状态检查失败:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
  
  getLastBackupTime() {
    const backupFiles = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        path: path.join(this.backupDir, file),
        time: fs.statSync(path.join(this.backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    return backupFiles.length > 0 ? backupFiles[0].time : null;
  }
  
  // 断开连接
  async disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      this.db.close((err) => {
        if (err) {
          logger.error('数据库关闭失败:', err);
          reject(err);
        } else {
          this.isConnected = false;
          logger.info('✅ 数据库连接已关闭');
          resolve();
        }
      });
    });
  }
  
  // 检查连接状态
  isConnected() {
    return this.isConnected;
  }
}

module.exports = DatabaseService;
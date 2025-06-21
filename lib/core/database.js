const mysql = require('mysql2/promise');
const path = require('path');
const Logger = require('../utils/logger');
const FileUtils = require('../utils/fileUtils');

class Database {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        user: this.config.user,
        port: this.config.port,
        password: this.config.password,
        multipleStatements: true
      });
      
      Logger.checkmark('Database connected successfully');
      return this.connection;
    } catch (error) {
      Logger.crossmark(`Database connection failed: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      Logger.gray('Database disconnected');
    }
  }

  async initializeMigrationTable() {
    const initSQL = `
      CREATE DATABASE IF NOT EXISTS \`dbshift\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
      
      CREATE TABLE IF NOT EXISTS \`dbshift\`.\`migration_history\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
        \`version\` varchar(20) CHARACTER SET utf8mb4 NOT NULL COMMENT '版本號',
        \`author\` varchar(20) CHARACTER SET utf8mb4 NOT NULL COMMENT '作者',
        \`file_desc\` varchar(100) CHARACTER SET utf8mb4 NOT NULL COMMENT '檔名描述',
        \`file_name\` varchar(200) CHARACTER SET utf8mb4 NOT NULL COMMENT '檔名',
        \`status\` tinyint(1) DEFAULT '0' COMMENT '狀態',
        \`create_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
        \`modify_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改時間',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_version_author\` (\`version\`, \`author\`)
      );
    `;

    try {
      await this.connection.query(initSQL);
      Logger.checkmark('Migration table initialized');
    } catch (error) {
      Logger.crossmark(`Failed to initialize migration table: ${error.message}`);
      throw error;
    }
  }

  async executeSQL(sql) {
    try {
      const [results] = await this.connection.query(sql);
      return results;
    } catch (error) {
      Logger.crossmark(`SQL execution failed: ${error.message}`);
      throw error;
    }
  }

  async executeSQLFile(filePath) {
    try {
      let content = FileUtils.readFile(filePath);
      
      // 移除 DELIMITER 指令
      content = content.replace(/DELIMITER\s*;*/gm, '');
      
      // 分割 SQL 语句
      let statements;
      if (content.includes(';;')) {
        // 如果包含 ;;，按 ;; 分割
        statements = content.split(';;');
      } else {
        // 否则按分号分割，但保留多行注释的完整性
        statements = content.split(/;\s*(?:\r?\n|$)/)
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.match(/^--/) && stmt !== '');
      }
      
      // 过滤空语句和纯注释
      statements = statements
        .map(stmt => stmt.trim())
        .filter(stmt => {
          if (!stmt || stmt === '\r\n') return false;
          // 移除注释行后检查是否还有实际 SQL
          const withoutComments = stmt.replace(/--.*$/gm, '').trim();
          return withoutComments.length > 0;
        });

      if (statements.length === 0) {
        Logger.warning(`⚠ No executable SQL found in ${path.basename(filePath)}`);
        return;
      }

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await this.connection.query(statement);
            
            // 如果是 CREATE DATABASE 语句，给一点时间让数据库完全创建
            if (statement.toUpperCase().includes('CREATE DATABASE')) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            // 如果是 USE 语句失败，提供更友好的错误信息
            if (statement.toUpperCase().includes('USE ') && error.code === 'ER_BAD_DB_ERROR') {
              Logger.crossmark(`Database not found in statement: ${statement}`);
              Logger.warning(`💡 Make sure the database exists or create it first`);
            }
            throw error;
          }
        }
      }
      
      Logger.checkmark(`${path.basename(filePath)} executed successfully`);
    } catch (error) {
      Logger.crossmark(`Failed to execute ${path.basename(filePath)}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Database;
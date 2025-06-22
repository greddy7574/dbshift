const Config = require('../core/config');
const Database = require('../core/database');
const MigrationManager = require('../core/migration');
const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const { DatabaseError, ConfigurationError } = require('../utils/errors');

async function migrateCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    Logger.info('🔄 Running database migrations...');

    let database = null;
    
    try {
      // 加载配置
      const config = new Config(options.env);
      const dbConfig = config.load();
      
      if (!dbConfig) {
        throw new ConfigurationError('No database configuration found');
      }

      config.validate();

      // 连接数据库
      database = new Database(dbConfig);
      await database.connect();

      // 初始化迁移表
      await database.initializeMigrationTable();

      // 执行迁移
      const migrationManager = new MigrationManager(database);
      await migrationManager.runMigrations();

    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        throw new DatabaseError('Database connection failed', error);
      }
      
      // 将所有数据库相关错误包装为 DatabaseError
      if (error.code && error.code.startsWith('ER_')) {
        throw new DatabaseError(`Migration execution failed: ${error.message}`, error);
      }
      
      throw error;
    } finally {
      if (database) {
        await database.disconnect();
      }
    }
  });
}

module.exports = migrateCommand;
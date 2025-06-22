const chalk = require('chalk');
const Config = require('../core/config');
const Database = require('../core/database');
const MigrationManager = require('../core/migration');
const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const { DatabaseError, ConfigurationError } = require('../utils/errors');

async function statusCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    Logger.info('📊 Checking migration status...');

    let database = null;
    
    try {
      // 加载配置
      const config = new Config(options.env);
      const dbConfig = config.load();
      
      if (!dbConfig) {
        throw new ConfigurationError('No database configuration found. Run "dbshift init" to create configuration.');
      }

      config.validate();

      // 连接数据库
      database = new Database(dbConfig);
      await database.connect();

      // 初始化迁移表（如果不存在）
      await database.initializeMigrationTable();

      // 获取迁移状态
      const migrationManager = new MigrationManager(database);
      const allMigrations = await migrationManager.findMigrationFiles();
      const executedMigrations = await migrationManager.getExecutedMigrations();
      const pendingMigrations = await migrationManager.getPendingMigrations();

      // 创建执行状态映射
      const executedMap = new Map();
      executedMigrations.forEach(migration => {
        const key = `${migration.version}_${migration.author}`;
        executedMap.set(key, migration);
      });

      console.log(chalk.blue('\n📋 Migration Status:'));
      console.log('─'.repeat(80));
      
      if (allMigrations.length === 0) {
        console.log(chalk.yellow('No migration files found'));
        console.log(chalk.gray('💡 Use "dbshift create <name>" to create your first migration'));
        // 不要在这里直接 return，让函数自然结束  
      } else {
        // 显示迁移状态
        allMigrations.forEach(migration => {
        const key = `${migration.version}_${migration.author}`;
        const executed = executedMap.get(key);
        
        let status, statusColor;
        if (executed && executed.status === 1) {
          status = '✓ Completed';
          statusColor = 'green';
        } else if (executed && executed.status === 0) {
          status = '⏳ Pending';
          statusColor = 'yellow';
        } else {
          status = '○ Not executed';
          statusColor = 'gray';
        }

        console.log(
          `${chalk[statusColor](status.padEnd(15))} ${migration.version} | ${migration.author.padEnd(10)} | ${migration.description}`
        );
      });

        console.log('─'.repeat(80));
        console.log(chalk.blue(`Total migrations: ${allMigrations.length}`));
        console.log(chalk.green(`Completed: ${executedMigrations.filter(m => m.status === 1).length}`));
        console.log(chalk.yellow(`Pending: ${pendingMigrations.length}`));

        if (pendingMigrations.length > 0) {
          console.log(chalk.blue('\n🔄 Run "dbshift migrate" to execute pending migrations'));
        }
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        throw new DatabaseError('Database connection failed', error);
      }
      throw error;
    } finally {
      if (database) {
        await database.disconnect();
      }
    }
  });
}

module.exports = statusCommand;
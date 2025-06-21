const chalk = require('chalk');
const Config = require('../core/config');
const Database = require('../core/database');
const MigrationManager = require('../core/migration');

async function statusCommand(options) {
  console.log(chalk.blue('📊 Checking migration status...'));

  let database = null;
  
  try {
    // 加载配置
    const config = new Config(options.env);
    const dbConfig = config.load();
    
    if (!dbConfig) {
      console.error(chalk.red('✗ No database configuration found'));
      console.log(chalk.yellow('Run "dbshift init" to create configuration'));
      process.exit(1);
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
      return;
    }

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

  } catch (error) {
    console.error(chalk.red('✗ Status check failed:'), error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.yellow('💡 Make sure your database server is running'));
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(chalk.yellow('💡 Check your database credentials'));
    }
    
    process.exit(1);
  } finally {
    if (database) {
      await database.disconnect();
    }
  }
}

module.exports = statusCommand;
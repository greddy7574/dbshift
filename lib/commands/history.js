const chalk = require('chalk');
const Config = require('../core/config');
const Database = require('../core/database');
const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const { DatabaseError, ConfigurationError } = require('../utils/errors');

async function historyCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    Logger.info('📜 Loading migration history...');

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

      // 构建查询语句
      let query = 'SELECT * FROM `dbshift`.`migration_history`';
      let queryParams = [];

      // 如果指定了作者过滤
      if (options.author) {
        query += ' WHERE author = ?';
        queryParams.push(options.author);
      }

      // 按创建时间排序
      query += ' ORDER BY create_date ASC';

      // 执行查询
      const [rows] = await database.connection.query(query, queryParams);

      // 显示结果
      if (rows.length === 0) {
        if (options.author) {
          console.log(chalk.yellow(`📭 No migration history found for author "${options.author}"`));
        } else {
          console.log(chalk.yellow('📭 No migration history found'));
        }
        console.log(chalk.gray('💡 Run "dbshift migrate" to execute migrations first'));
        return;
      }

      // 显示标题
      const titleText = options.author 
        ? `Migration History for Author: ${options.author}`
        : 'Migration History';
      
      console.log(chalk.blue(`\n📜 ${titleText}`));
      console.log('─'.repeat(100));

      // 显示表头
      console.log(
        chalk.bold(
          'Status'.padEnd(12) + 
          'Version'.padEnd(12) + 
          'Author'.padEnd(12) + 
          'Description'.padEnd(30) + 
          'Execute Time'.padEnd(20) + 
          'File Name'
        )
      );
      console.log('─'.repeat(100));

      // 显示每条记录
      rows.forEach(record => {
        // 状态显示
        let status, statusColor;
        if (record.status === 1) {
          status = '✓ Completed';
          statusColor = 'green';
        } else {
          status = '⏳ Pending';
          statusColor = 'yellow';
        }

        // 时间格式化
        const executeTime = record.status === 1 
          ? record.modify_date.toISOString().replace('T', ' ').substring(0, 19)
          : record.create_date.toISOString().replace('T', ' ').substring(0, 19);

        // 显示记录
        console.log(
          chalk[statusColor](status.padEnd(12)) +
          chalk.cyan(record.version.padEnd(12)) +
          chalk.magenta(record.author.padEnd(12)) +
          chalk.white(record.file_desc.substring(0, 28).padEnd(30)) +
          chalk.gray(executeTime.padEnd(20)) +
          chalk.gray(record.file_name)
        );
      });

      // 显示统计信息
      console.log('─'.repeat(100));
      const completedCount = rows.filter(r => r.status === 1).length;
      const pendingCount = rows.filter(r => r.status === 0).length;

      console.log(chalk.blue(`Total records: ${rows.length}`));
      console.log(chalk.green(`Completed: ${completedCount}`));
      if (pendingCount > 0) {
        console.log(chalk.yellow(`Pending: ${pendingCount}`));
      }

      // 显示作者统计（只在没有过滤作者时显示）
      if (!options.author && rows.length > 0) {
        const authorStats = new Map();
        rows.forEach(record => {
          const author = record.author;
          if (!authorStats.has(author)) {
            authorStats.set(author, { total: 0, completed: 0 });
          }
          authorStats.get(author).total++;
          if (record.status === 1) {
            authorStats.get(author).completed++;
          }
        });

        console.log(chalk.blue('\n📊 By Author:'));
        authorStats.forEach((stats, author) => {
          console.log(
            `  ${chalk.magenta(author.padEnd(15))} ${chalk.green(stats.completed)}/${chalk.blue(stats.total)} completed`
          );
        });
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

module.exports = historyCommand;
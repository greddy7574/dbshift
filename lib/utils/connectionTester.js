const chalk = require('chalk');
const Database = require('../core/database');

class ConnectionTester {
  
  /**
   * 测试数据库连接
   * @param {Object} dbConfig - 数据库配置
   * @param {Object} options - 测试选项
   * @param {boolean} options.verbose - 是否显示详细信息
   * @param {boolean} options.testMigrationTable - 是否测试迁移表访问
   * @returns {Promise<Object>} 测试结果
   */
  static async testConnection(dbConfig, options = {}) {
    const { verbose = true, testMigrationTable = false } = options;
    
    if (verbose) {
      console.log(chalk.blue('🔍 Testing database connection...'));
    }
    
    const startTime = Date.now();
    const database = new Database(dbConfig);
    
    try {
      // 测试基本连接
      await database.connect();
      const connectTime = Date.now() - startTime;
      
      // 测试查询
      const queryStartTime = Date.now();
      const result = await database.query('SELECT 1 as test_connection, VERSION() as mysql_version');
      const queryTime = Date.now() - queryStartTime;
      
      // 获取服务器信息
      const serverInfo = await database.query('SELECT @@version_comment as server_comment');
      
      await database.disconnect();
      const totalTime = Date.now() - startTime;
      
      const connectionResult = {
        success: true,
        mysql_version: result[0].mysql_version,
        server_comment: serverInfo[0].server_comment,
        timing: {
          connect: connectTime,
          query: queryTime,
          total: totalTime
        }
      };
      
      if (verbose) {
        console.log(chalk.green('✓ Database connection successful'));
        console.log(chalk.gray(`  MySQL Version: ${connectionResult.mysql_version}`));
        console.log(chalk.gray(`  Connection Time: ${connectTime}ms`));
      }
      
      // 测试迁移表访问（如果需要）
      if (testMigrationTable) {
        const migrationResult = await this.testMigrationTableAccess(dbConfig, verbose);
        connectionResult.migration = migrationResult;
      }
      
      return connectionResult;
      
    } catch (error) {
      if (verbose) {
        console.log(chalk.red('✗ Database connection failed:'), error.message);
        this.showTroubleshootingSuggestions(error);
      }
      throw error;
    }
  }
  
  /**
   * 测试迁移表访问
   * @param {Object} dbConfig - 数据库配置
   * @param {boolean} verbose - 是否显示详细信息
   * @returns {Promise<Object>} 迁移表测试结果
   */
  static async testMigrationTableAccess(dbConfig, verbose = true) {
    if (verbose) {
      console.log(chalk.blue('🔍 Testing migration table access...'));
    }
    
    const database = new Database(dbConfig);
    await database.connect();
    
    try {
      // 检查迁移表是否存在
      const tableExists = await database.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '${dbConfig.database || 'dbshift'}' 
        AND table_name = 'migration_history'
      `);
      
      const migrationResult = {
        table_exists: tableExists[0].count > 0,
        total_migrations: 0,
        completed_migrations: 0,
        pending_migrations: 0
      };
      
      if (migrationResult.table_exists) {
        // 获取迁移统计信息
        const migrationStats = await database.query(`
          SELECT 
            COUNT(*) as total_migrations,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as completed_migrations,
            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_migrations
          FROM \`${dbConfig.database || 'dbshift'}\`.migration_history
        `);
        
        Object.assign(migrationResult, migrationStats[0]);
        
        if (verbose) {
          console.log(chalk.green('✓ Migration table accessible'));
          console.log(chalk.gray(`  Total migrations: ${migrationResult.total_migrations}`));
          console.log(chalk.gray(`  Completed: ${migrationResult.completed_migrations}`));
          console.log(chalk.gray(`  Pending: ${migrationResult.pending_migrations}`));
        }
      } else {
        if (verbose) {
          console.log(chalk.yellow('⚠ Migration table not found (will be created on first migration)'));
        }
      }
      
      await database.disconnect();
      return migrationResult;
      
    } catch (error) {
      await database.disconnect();
      if (verbose) {
        console.log(chalk.yellow('⚠ Migration table access test failed:'), error.message);
        console.log(chalk.gray('  This is normal if the migration table hasn\'t been created yet'));
      }
      throw error;
    }
  }
  
  /**
   * 显示故障排除建议
   * @param {Error} error - 连接错误
   */
  static showTroubleshootingSuggestions(error) {
    console.log(chalk.yellow('\n🔧 Troubleshooting suggestions:'));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.gray('  • Check if MySQL server is running'));
      console.log(chalk.gray('  • Verify host and port are correct'));
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(chalk.gray('  • Check username and password'));
      console.log(chalk.gray('  • Verify user has necessary permissions'));
    } else if (error.code === 'ENOTFOUND') {
      console.log(chalk.gray('  • Check if hostname is correct'));
      console.log(chalk.gray('  • Verify DNS resolution'));
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(chalk.gray('  • Database does not exist'));
      console.log(chalk.gray('  • Check database name in configuration'));
    } else {
      console.log(chalk.gray(`  • Error code: ${error.code || 'Unknown'}`));
      console.log(chalk.gray('  • Check MySQL server logs for details'));
    }
  }
}

module.exports = ConnectionTester;
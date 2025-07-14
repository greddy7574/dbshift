const chalk = require('chalk');
const Config = require('../core/config');
const ConnectionTester = require('../utils/connectionTester');

async function testConnectionCommand(options) {
  const env = options.env || 'development';
  
  console.log(chalk.blue(`🔍 Testing database connection for [${env}] environment...`));

  try {
    let dbConfig = {};
    
    // 如果提供了命令行参数，使用命令行参数（临时测试，不保存）
    if (options.host || options.user || options.password || options.port) {
      console.log(chalk.gray('📝 Using command-line parameters for testing (not saved)'));
      
      dbConfig = {
        host: options.host || 'localhost',
        user: options.user || 'root',
        port: options.port || 3306,
        password: options.password || ''
      };
      
      // 显示连接参数
      console.log(chalk.gray(`  Host: ${dbConfig.host}:${dbConfig.port}`));
      console.log(chalk.gray(`  User: ${dbConfig.user}`));
      console.log(chalk.gray(`  Password: ${dbConfig.password ? '***' : '(empty)'}`));
      
    } else {
      // 使用现有配置文件
      console.log(chalk.gray('📋 Loading configuration from files...'));
      
      const configLoader = new Config(env);  // 🔑 修复：传递环境参数到构造函数
      const config = configLoader.load();
      
      if (!config) {
        console.log(chalk.red('✗ No configuration found'));
        console.log(chalk.yellow('💡 Hint: Run "dbshift config-init" to create configuration'));
        console.log(chalk.yellow('💡 Or use command-line parameters: dbshift test-connection --host=localhost --user=root'));
        return;
      }
      
      dbConfig = config;
      
      // 显示加载的配置
      console.log(chalk.gray(`  Host: ${dbConfig.host}:${dbConfig.port || 3306}`));
      console.log(chalk.gray(`  User: ${dbConfig.user || 'root'}`));
      console.log(chalk.gray(`  Password: ${dbConfig.password ? '***' : '(empty)'}`));
    }

    // 执行连接测试
    console.log(chalk.blue('\n⚡ Connecting to database...'));
    
    try {
      const result = await ConnectionTester.testConnection(dbConfig, {
        verbose: true,
        testMigrationTable: true
      });
      
      // 显示详细信息
      console.log(chalk.blue('\n📊 Connection Details:'));
      console.log(chalk.gray(`  Server Comment: ${result.server_comment}`));
      console.log(chalk.gray(`  Query Time: ${result.timing.query}ms`));
      console.log(chalk.gray(`  Total Time: ${result.timing.total}ms`));
      
      console.log(chalk.green('\n🎉 All connection tests passed!'));
      
    } catch (error) {
      console.log(chalk.gray('\n💡 For help: dbshift test-connection --help'));
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(1);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error(chalk.red('✗ Connection test failed:'), error.message);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

module.exports = testConnectionCommand;
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Config = require('../../core/config');

async function showConfigCommand(options) {
  console.log(chalk.blue('📋 Current database configuration:'));

  try {
    // 使用统一的配置加载逻辑
    const config = new Config(options.env);
    const loadedConfig = config.load();
    
    if (!loadedConfig) {
      console.log(chalk.yellow('⚠ No configuration found'));
      console.log(chalk.gray('💡 Run "dbshift config init" to create configuration'));
      return;
    }

    // 检查实际使用的配置文件类型
    const configPath = path.join(process.cwd(), 'schema.config.js');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(configPath)) {
      try {
        // 尝试加载JS配置以确定是否成功使用
        const configModule = require(configPath);
        if (configModule[options.env]) {
          console.log(chalk.green('✓ Configuration file: schema.config.js'));
          
          // 显示配置详情
          console.log(chalk.blue(`\n[${options.env}] Environment:`));
          console.log(chalk.gray(`  Host: ${loadedConfig.host}:${loadedConfig.port || 3306}`));
          console.log(chalk.gray(`  User: ${loadedConfig.user || 'N/A'}`));
          console.log(chalk.gray(`  Password: ${loadedConfig.password ? '***' : 'N/A'}`));
          console.log(chalk.gray(`  Database: dbshift (fixed)`));
          
          // 显示所有可用环境
          const environments = Object.keys(configModule);
          if (environments.length > 0) {
            console.log(chalk.blue('\n🌍 Available environments:'));
            environments.forEach(env => {
              const marker = env === options.env ? chalk.green('→') : ' ';
              console.log(`  ${marker} ${env}`);
            });
          }
          return;
        }
      } catch (error) {
        // JS配置加载失败，继续检查是否回退到.env
      }
    }
    
    // 如果到这里，说明使用的是.env配置（或JS配置失败回退）
    if (fs.existsSync(envPath)) {
      console.log(chalk.green('✓ Configuration file: .env'));
      if (fs.existsSync(configPath)) {
        console.log(chalk.yellow('⚠ schema.config.js exists but failed to load, using .env as fallback'));
      }
    } else {
      console.log(chalk.green('✓ Configuration source: environment variables'));
    }
    
    // 显示配置详情
    console.log(chalk.blue(`\n[${options.env}] Environment:`));
    console.log(chalk.gray(`  Host: ${loadedConfig.host}:${loadedConfig.port || 3306}`));
    console.log(chalk.gray(`  User: ${loadedConfig.user || 'N/A'}`));
    console.log(chalk.gray(`  Password: ${loadedConfig.password ? '***' : 'N/A'}`));
    console.log(chalk.gray(`  Database: dbshift (fixed)`));

  } catch (error) {
    console.error(chalk.red('✗ Failed to read configuration:'), error.message);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

module.exports = showConfigCommand;
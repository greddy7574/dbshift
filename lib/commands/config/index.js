const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Config = require('../../core/config');

async function showConfigCommand(options) {
  console.log(chalk.blue('📋 Current database configuration:'));

  try {
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), 'schema.config.js');
    
    if (fs.existsSync(configPath)) {
      console.log(chalk.green('✓ Configuration file: schema.config.js'));
      
      try {
        const configModule = require(configPath);
        const envConfig = configModule[options.env];
        
        if (envConfig) {
          console.log(chalk.blue(`\n[${options.env}] Environment:`));
          console.log(chalk.gray(`  Host: ${envConfig.host}:${envConfig.port || 3306}`));
          console.log(chalk.gray(`  User: ${envConfig.user || 'N/A'}`));
          console.log(chalk.gray(`  Password: ${envConfig.password ? '***' : 'N/A'}`));
        } else {
          console.log(chalk.yellow(`⚠ No configuration found for environment: ${options.env}`));
        }
        
        // 显示所有可用环境
        const environments = Object.keys(configModule);
        if (environments.length > 0) {
          console.log(chalk.blue('\n🌍 Available environments:'));
          environments.forEach(env => {
            const marker = env === options.env ? chalk.green('→') : ' ';
            console.log(`  ${marker} ${env}`);
          });
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to load config:'), error.message);
      }
    } else if (fs.existsSync(envPath)) {
      console.log(chalk.green('✓ Configuration file: .env'));
      
      // 读取 .env 文件
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      const config = {};
      
      envLines.forEach(line => {
        const [key, value] = line.split('=', 2);
        if (key && value) {
          switch (key.trim()) {
            case 'MYSQL_HOST': config.host = value.trim(); break;
            case 'MYSQL_PORT': config.port = value.trim(); break;
            case 'MYSQL_USERNAME': config.user = value.trim(); break;
            case 'MYSQL_PASSWORD': config.password = value.trim(); break;
          }
        }
      });
      
      console.log(chalk.blue(`\n[${options.env}] Environment:`));
      console.log(chalk.gray(`  Host: ${config.host || 'N/A'}:${config.port || 3306}`));
      console.log(chalk.gray(`  User: ${config.user || 'N/A'}`));
      console.log(chalk.gray(`  Password: ${config.password ? '***' : 'N/A'}`));
    } else {
      console.log(chalk.yellow('⚠ No configuration found'));
      console.log(chalk.gray('💡 Run "dbshift config init" to create configuration'));
    }

  } catch (error) {
    console.error(chalk.red('✗ Failed to read configuration:'), error.message);
    process.exit(1);
  }
}

module.exports = showConfigCommand;
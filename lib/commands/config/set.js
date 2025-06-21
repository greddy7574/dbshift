const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function configSetCommand(options) {
  const env = options.env || 'development';
  
  console.log(chalk.blue(`⚙️  Setting database configuration for [${env}] environment...`));

  try {
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), 'schema.config.js');
    
    // 检查是否提供了任何配置参数
    const hasConfigParams = options.host || options.user || options.password || options.port;
    if (!hasConfigParams) {
      console.log(chalk.yellow('⚠ No configuration parameters provided'));
      console.log(chalk.gray('Example: dbshift config set --host=localhost --user=root --password=123456'));
      return;
    }

    // 确定使用哪种配置文件
    let configType = 'env';
    let useSchemaConfig = false;

    if (fs.existsSync(configPath)) {
      configType = 'js';
      useSchemaConfig = true;
    } else if (!fs.existsSync(envPath) && env !== 'development') {
      // 如果是非开发环境且没有 .env 文件，创建 schema.config.js
      configType = 'js';
      useSchemaConfig = true;
    }

    if (useSchemaConfig) {
      // 处理 schema.config.js 文件
      let configContent = {};
      
      if (fs.existsSync(configPath)) {
        try {
          configContent = require(configPath);
        } catch (error) {
          console.warn(chalk.yellow('⚠ Failed to load existing config, creating new one'));
          configContent = {};
        }
      }

      // 确保环境配置存在
      if (!configContent[env]) {
        configContent[env] = {};
      }

      // 更新配置
      if (options.host) configContent[env].host = options.host;
      if (options.port) configContent[env].port = parseInt(options.port);
      if (options.user) configContent[env].user = options.user;
      if (options.password) configContent[env].password = options.password;

      // 如果是生产环境，确保使用环境变量回退
      if (env === 'production') {
        const prodConfig = configContent[env];
        configContent[env] = {
          host: `process.env.MYSQL_HOST || '${prodConfig.host || 'localhost'}'`,
          port: `process.env.MYSQL_PORT || ${prodConfig.port || 3306}`,
          user: `process.env.MYSQL_USERNAME || '${prodConfig.user || 'root'}'`,
          password: `process.env.MYSQL_PASSWORD || '${prodConfig.password || ''}'`
        };
      }

      // 生成配置文件内容
      const configFileContent = generateConfigFileContent(configContent);
      fs.writeFileSync(configPath, configFileContent);
      
      console.log(chalk.green(`✓ Updated schema.config.js for [${env}] environment`));
      
    } else {
      // 处理 .env 文件
      let envContent = '';
      let envConfig = {};

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');
        
        // 解析现有配置
        envLines.forEach(line => {
          const [key, value] = line.split('=', 2);
          if (key && value) {
            envConfig[key.trim()] = value.trim();
          }
        });
      }

      // 更新配置
      if (options.host) envConfig['MYSQL_HOST'] = options.host;
      if (options.port) envConfig['MYSQL_PORT'] = options.port;
      if (options.user) envConfig['MYSQL_USERNAME'] = options.user;
      if (options.password) envConfig['MYSQL_PASSWORD'] = options.password;

      // 重新生成 .env 文件内容
      const newEnvContent = `### MySQL Database Configuration
MYSQL_HOST=${envConfig['MYSQL_HOST'] || 'localhost'}
MYSQL_PORT=${envConfig['MYSQL_PORT'] || '3306'}
MYSQL_USERNAME=${envConfig['MYSQL_USERNAME'] || 'root'}
MYSQL_PASSWORD=${envConfig['MYSQL_PASSWORD'] || ''}

# For production deployment, override these with environment variables:
# export MYSQL_HOST=your-prod-host
# export MYSQL_USERNAME=your-prod-user
# export MYSQL_PASSWORD=your-prod-password
`;

      fs.writeFileSync(envPath, newEnvContent);
      console.log(chalk.green('✓ Updated .env configuration file'));
    }

    // 显示更新的配置
    console.log(chalk.blue('\n📋 Updated configuration:'));
    if (options.host) console.log(chalk.gray(`  Host: ${options.host}`));
    if (options.port) console.log(chalk.gray(`  Port: ${options.port}`));
    if (options.user) console.log(chalk.gray(`  User: ${options.user}`));
    if (options.password) console.log(chalk.gray(`  Password: ***`));

    // 测试连接（如果提供了完整的连接信息）
    if (options.host && options.user) {
      console.log(chalk.blue('\n🔍 Testing database connection...'));
      
      try {
        const ConnectionTester = require('../../utils/connectionTester');
        await ConnectionTester.testConnection({
          host: options.host,
          user: options.user,
          port: options.port || 3306,
          password: options.password || ''
        }, { verbose: true, testMigrationTable: false });
        
      } catch (error) {
        // 连接失败只是警告，不阻止配置保存
      }
    }

  } catch (error) {
    console.error(chalk.red('✗ Configuration update failed:'), error.message);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

function generateConfigFileContent(config) {
  let content = 'module.exports = {\n';
  
  Object.keys(config).forEach(env => {
    content += `  ${env}: {\n`;
    const envConfig = config[env];
    
    Object.keys(envConfig).forEach(key => {
      const value = envConfig[key];
      if (typeof value === 'string' && value.startsWith('process.env.')) {
        content += `    ${key}: ${value},\n`;
      } else if (typeof value === 'string') {
        content += `    ${key}: '${value}',\n`;
      } else {
        content += `    ${key}: ${value},\n`;
      }
    });
    
    content += '  },\n\n';
  });
  
  content += '};\n';
  return content;
}

module.exports = configSetCommand;
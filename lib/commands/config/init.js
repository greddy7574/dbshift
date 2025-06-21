const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function configInitCommand(options) {
  const env = options.env || 'development';
  
  console.log(chalk.blue('⚙️  Initializing database configuration...'));

  try {
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), 'schema.config.js');
    
    // 检查现有配置
    let currentConfig = {};
    let configExists = false;
    let configType = 'env';

    if (fs.existsSync(configPath)) {
      configExists = true;
      configType = 'js';
      try {
        const configModule = require(configPath);
        currentConfig = configModule[env] || configModule.default || configModule;
      } catch (error) {
        console.warn(chalk.yellow('⚠ Failed to load existing config:', error.message));
      }
    } else if (fs.existsSync(envPath)) {
      configExists = true;
      configType = 'env';
      // 读取现有 .env 文件
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      envLines.forEach(line => {
        const [key, value] = line.split('=', 2);
        if (key && value) {
          switch (key.trim()) {
            case 'MYSQL_HOST': currentConfig.host = value.trim(); break;
            case 'MYSQL_PORT': currentConfig.port = value.trim(); break;
            case 'MYSQL_USERNAME': currentConfig.user = value.trim(); break;
            case 'MYSQL_PASSWORD': currentConfig.password = value.trim(); break;
          }
        }
      });
    }

    if (configExists) {
      console.log(chalk.green(`✓ Found existing ${configType === 'js' ? 'schema.config.js' : '.env'} configuration`));
      
      if (currentConfig.host) {
        console.log(chalk.gray(`  Host: ${currentConfig.host}:${currentConfig.port || 3306}`));
        console.log(chalk.gray(`  User: ${currentConfig.user || 'root'}`));
      }
    }

    // 询问是否要更新配置
    if (configExists) {
      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: 'Configuration already exists. Update it?',
          default: false
        }
      ]);
      
      if (!shouldUpdate) {
        console.log(chalk.yellow('⚠ Configuration update cancelled'));
        return;
      }
    }

    // 询问配置类型（如果是新配置）
    if (!configExists) {
      const { newConfigType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'newConfigType',
          message: 'Choose configuration format:',
          choices: [
            { 
              name: '.env file (Simple) - Recommended for production deployment', 
              value: 'env' 
            },
            { 
              name: 'schema.config.js (Advanced) - For multiple environments', 
              value: 'js' 
            }
          ],
          default: 'env'
        }
      ]);
      configType = newConfigType;
    }

    // 询问数据库连接信息
    const dbConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Database host:',
        default: currentConfig.host || 'localhost'
      },
      {
        type: 'input',
        name: 'port',
        message: 'Database port:',
        default: currentConfig.port || '3306'
      },
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: currentConfig.user || 'root'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        default: currentConfig.password || ''
      }
    ]);

    // 测试连接
    const { testConnection } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'testConnection',
        message: 'Test database connection?',
        default: true
      }
    ]);

    if (testConnection) {
      try {
        const ConnectionTester = require('../../utils/connectionTester');
        await ConnectionTester.testConnection({
          host: dbConfig.host,
          user: dbConfig.username,
          port: dbConfig.port,
          password: dbConfig.password
        }, { verbose: true, testMigrationTable: false });
        
      } catch (error) {
        const { continueAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAnyway',
            message: 'Save configuration anyway?',
            default: false
          }
        ]);
        
        if (!continueAnyway) {
          console.log(chalk.yellow('Configuration cancelled'));
          return;
        }
      }
    }

    // 保存配置
    if (configType === 'env') {
      const envContent = `### MySQL Database Configuration
MYSQL_HOST=${dbConfig.host}
MYSQL_PORT=${dbConfig.port}
MYSQL_USERNAME=${dbConfig.username}
MYSQL_PASSWORD=${dbConfig.password}

# For production deployment, override these with environment variables:
# export MYSQL_HOST=your-prod-host
# export MYSQL_USERNAME=your-prod-user
# export MYSQL_PASSWORD=your-prod-password
`;
      fs.writeFileSync(envPath, envContent);
      console.log(chalk.green('✓ Created .env configuration file'));
      console.log(chalk.gray('💡 For production, use environment variables to override .env values'));
    } else {
      const configContent = `module.exports = {
  development: {
    host: '${dbConfig.host}',
    port: ${dbConfig.port},
    user: '${dbConfig.username}',
    password: '${dbConfig.password}'
  },
  
  staging: {
    host: '${dbConfig.host}',
    port: ${dbConfig.port},
    user: '${dbConfig.username}',
    password: '${dbConfig.password}'
  },
  
  production: {
    host: process.env.MYSQL_HOST || '${dbConfig.host}',
    port: process.env.MYSQL_PORT || ${dbConfig.port},
    user: process.env.MYSQL_USERNAME || '${dbConfig.username}',
    password: process.env.MYSQL_PASSWORD || '${dbConfig.password}'
  }
};
`;
      fs.writeFileSync(configPath, configContent);
      console.log(chalk.green('✓ Created schema.config.js configuration file'));
      console.log(chalk.gray('💡 Use "dbshift migrate -e production" to run with production config'));
      console.log(chalk.gray('💡 Set environment variables for production: MYSQL_HOST, MYSQL_USERNAME, etc.'));
    }

    console.log(chalk.blue('\n🎉 Database configuration initialized successfully!'));

  } catch (error) {
    console.error(chalk.red('✗ Configuration failed:'), error.message);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

module.exports = configInitCommand;
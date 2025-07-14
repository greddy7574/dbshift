const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');

async function initCommand() {
  await ErrorHandler.executeWithErrorHandling(async () => {
    Logger.info('🚀 Initializing Schema Migration in current directory...');

    try {
    // 检查是否在 DBShift 源代码目录中
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageContent.name === 'dbshift') {
        console.log(chalk.red('⚠ Warning: You are in the DBShift source code directory!'));
        console.log(chalk.yellow('💡 Please navigate to your actual project directory before running init.'));
        console.log(chalk.gray('   Example: cd /path/to/your/project && dbshift init'));
        
        const { confirmInit } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmInit',
            message: 'Are you sure you want to initialize here?',
            default: false
          }
        ]);
        
        if (!confirmInit) {
          console.log(chalk.yellow('⚠ Initialization cancelled'));
          return;
        }
      }
    }
    // 创建 migrations 目录
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log(chalk.green('✓ Created migrations/ directory'));
    } else {
      console.log(chalk.yellow('⚠ migrations/ directory already exists'));
    }

    // 检查是否已有配置文件
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), 'schema.config.js');
    const currentDir = path.basename(process.cwd());

    if (fs.existsSync(envPath) || fs.existsSync(configPath)) {
      console.log(chalk.yellow(`⚠ Found existing configuration in: ${currentDir}/`));
      if (fs.existsSync(envPath)) {
        console.log(chalk.gray('  - .env file detected'));
      }
      if (fs.existsSync(configPath)) {
        console.log(chalk.gray('  - schema.config.js file detected'));
      }
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration file already exists. Overwrite?',
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠ Skipping configuration setup'));
        console.log(chalk.gray('💡 If this is unexpected, make sure you are in the correct project directory'));
        return;
      }
    }

    // 询问配置偏好
    const { configType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configType',
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

    // 询问数据库连接信息
    const dbConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Database host:',
        default: 'localhost'
      },
      {
        type: 'input',
        name: 'port',
        message: 'Database port:',
        default: '3306'
      },
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: 'root'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Database password:'
      }
    ]);

    // 创建配置文件
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

    // 创建示例迁移文件
    const exampleMigration = `-- Example migration file
-- Use this as a template for your migrations

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS \`my_app\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE \`my_app\`;

-- Create users table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for better performance
CREATE INDEX \`idx_users_email\` ON \`users\` (\`email\`);
`;

    const exampleFilename = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}01_Admin_example_migration.sql`;
    const examplePath = path.join(migrationsDir, exampleFilename);

    fs.writeFileSync(examplePath, exampleMigration);
    console.log(chalk.green(`✓ Created example migration: ${exampleFilename}`));

    console.log(chalk.green('\n🎉 Schema Migration initialized successfully!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.gray('  1. Edit your migration files in the migrations/ directory'));
    console.log(chalk.gray('  2. Run "dbshift migrate" to execute pending migrations'));
    console.log(chalk.gray('  3. Use "dbshift create <name>" to create new migration files'));

    } catch (error) {
      throw error;
    }
  });
}

module.exports = initCommand;

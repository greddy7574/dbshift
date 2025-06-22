#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const inquirer = require('inquirer');
const packageInfo = require('../package.json');

// 导入所有命令处理器 (复用原有的命令逻辑)
const initCommand = require('../lib/commands/init');
const migrateCommand = require('../lib/commands/migrate');
const statusCommand = require('../lib/commands/status');
const createCommand = require('../lib/commands/create');
const showConfigCommand = require('../lib/commands/config/index');
const configInitCommand = require('../lib/commands/config/init');
// const configSetCommand = require('../lib/commands/config/set'); // 暂时不用，保留给未来扩展
const testConnectionCommand = require('../lib/commands/test-connection');

class DBShiftInteractive {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('dbshift> '),
      completer: this.completer.bind(this)
    });

    this.currentContext = 'main';
    this.commands = this.getAvailableCommands();
    this.setupReadline();
  }

  getAvailableCommands() {
    return {
      main: [
        { command: '/init', description: 'Initialize new project' },
        { command: '/migrate', description: 'Run pending migrations' },
        { command: '/status', description: 'Show migration status' },
        { command: '/create', description: 'Create new migration' },
        { command: '/config', description: 'Configuration management' },
        { command: '/ping', description: 'Test database connection' },
        { command: '/help', description: 'Show help menu' },
        { command: '/clear', description: 'Clear screen' },
        { command: 'q', description: 'Quit interactive mode' }
      ],
      config: [
        { command: '/config show', description: 'Show current configuration' },
        { command: '/config init', description: 'Interactive configuration setup' },
        { command: '/config set', description: 'Set configuration values' },
        { command: '/back', description: 'Back to main menu' }
      ]
    };
  }

  completer(line) {
    const currentCommands = this.currentContext === 'config'
      ? this.commands.config
      : this.commands.main;

    const completions = currentCommands.map(cmd => cmd.command);

    // 如果用戶輸入以 "/" 開始，提供命令補全
    if (line.startsWith('/')) {
      const hits = completions.filter(c => c.startsWith(line));

      // 如果有多個匹配，顯示所有選項
      if (hits.length > 1) {
        console.log('\n' + chalk.blue('📋 Available Commands:'));
        console.log('─'.repeat(60));

        hits.forEach(hit => {
          const cmdInfo = currentCommands.find(c => c.command === hit);
          if (cmdInfo) {
            console.log(`${chalk.cyan(hit.padEnd(20))} ${chalk.gray(cmdInfo.description)}`);
          }
        });
        console.log('─'.repeat(60));
        console.log(chalk.yellow('💡 Press Tab again to cycle through options'));
        console.log();
      }

      return [hits, line];
    }

    // 如果沒有輸入 "/"，提示使用斜槓命令
    if (line === '') {
      console.log('\n' + chalk.blue('💡 Available options:'));
      console.log(`${chalk.cyan('/')} ${chalk.gray('                   Show command menu')}`);
      console.log(`${chalk.cyan('/[command] + Tab')} ${chalk.gray('   Auto-complete commands')}`);
      console.log(`${chalk.cyan('q')} ${chalk.gray('                   Quit interactive mode')}`);
      console.log();
    }

    return [[], line];
  }

  setupReadline() {
    this.setupReadlineListeners();
  }

  setupReadlineListeners() {
    // 清除现有监听器，避免重复绑定
    this.rl.removeAllListeners('SIGINT');
    this.rl.removeAllListeners('line');
    this.rl.removeAllListeners('close');
    
    // 使用 readline 的內建事件來監聽輸入變化
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\nGoodbye! 👋'));
      process.exit(0);
    });

    this.rl.on('line', async (line) => {
      await this.handleInput(line.trim());
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye! 👋'));
      process.exit(0);
    });
  }

  // 重新创建 readline 接口来恢复所有功能，包括 Tab 补全
  recreateReadlineInterface() {
    // 先移除所有现有监听器，避免触发 close 事件
    this.rl.removeAllListeners('close');
    this.rl.removeAllListeners('SIGINT');
    this.rl.removeAllListeners('line');
    
    // 关闭当前接口（现在不会触发退出）
    this.rl.close();
    
    // 重新创建接口，恢复所有功能包括 completer
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('dbshift> '),
      completer: this.completer.bind(this)
    });
    
    // 重新设置监听器
    this.setupReadlineListeners();
    
    // 恢复提示符
    this.rl.prompt();
  }


  showCommandSelector() {
    let choices;
    if (this.currentContext === 'config') {
      choices = [
        { command: '/config show', description: 'Show current configuration' },
        { command: '/config init', description: 'Interactive configuration setup' },
        { command: '/config set', description: 'Set configuration values' },
        { command: '/back', description: 'Back to main menu' }
      ];
    } else {
      choices = [
        { command: '/init', description: 'Initialize new project' },
        { command: '/migrate', description: 'Run pending migrations' },
        { command: '/status', description: 'Show migration status' },
        { command: '/create', description: 'Create new migration' },
        { command: '/config', description: 'Configuration management' },
        { command: '/ping', description: 'Test database connection' },
        { command: '/clear', description: 'Clear screen' },
        { command: '/help', description: 'Show help menu' }
      ];
    }

    console.log(chalk.cyan('\n📋 Available Commands:'));
    console.log('─'.repeat(60));
    
    choices.forEach((choice, index) => {
      console.log(`${chalk.yellow((index + 1).toString().padStart(2))}. ${chalk.cyan(choice.command.padEnd(20))} ${chalk.gray(choice.description)}`);
    });
    console.log(`${chalk.yellow((choices.length + 1).toString().padStart(2))}. ${chalk.cyan('Cancel'.padEnd(20))} ${chalk.gray('Exit menu')}`);
    
    console.log('─'.repeat(60));
    console.log(chalk.blue('💡 Enter a number (1-' + (choices.length + 1) + ') or type a command directly:'));
    
    this.rl.prompt();
  }

  handleNumberChoice(number) {
    let choices;
    if (this.currentContext === 'config') {
      choices = [
        '/config show',
        '/config init', 
        '/config set',
        '/back'
      ];
    } else {
      choices = [
        '/init',
        '/migrate',
        '/status',
        '/create',
        '/config',
        '/ping',
        '/clear',
        '/help'
      ];
    }

    if (number >= 1 && number <= choices.length) {
      return choices[number - 1];
    } else if (number === choices.length + 1) {
      return null; // Cancel
    } else {
      return false; // Invalid choice
    }
  }

  async handleCreateCommand() {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'migrationName',
          message: 'Enter migration name:',
          validate: (input) => {
            if (!input.trim()) {
              return 'Migration name cannot be empty';
            }
            if (!/^[a-zA-Z0-9_]+$/.test(input.trim())) {
              return 'Migration name can only contain letters, numbers, and underscores';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'author',
          message: 'Enter author name (optional):',
          default: 'Admin'
        }
      ]);

      console.log(chalk.blue(`📝 Creating migration: ${answers.migrationName}`));
      await this.handleCreateMigration(answers.migrationName, answers.author);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      this.rl.prompt();
    }
  }

  async handleCreateMigration(migrationName, author) {
    const fs = require('fs');
    const path = require('path');
    
    // 完全关闭 readline 输入监听，让 inquirer 完全接管
    this.rl.pause();
    this.rl.removeAllListeners('line');
    
    try {
      // 检查 migrations 目录
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        throw new Error('Migrations directory not found. Run "dbshift init" to initialize the project.');
      }

      // 选择迁移类型
      const { migrationType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'migrationType',
          message: 'Choose migration type:',
          choices: [
            { name: 'Create Table', value: 'create_table' },
            { name: 'Alter Table', value: 'alter_table' },
            { name: 'Insert Data', value: 'insert_data' },
            { name: 'Create Index', value: 'create_index' },
            { name: 'Custom SQL', value: 'custom' }
          ]
        }
      ]);

      // 生成版本号
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0');

      // 按作者生成独立的序号
      const FileUtils = require('../lib/utils/fileUtils');
      const sequence = FileUtils.generateSequence(migrationsDir, dateStr, author);

      const version = dateStr + sequence;
      const sanitizedName = migrationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `${version}_${author}_${sanitizedName}.sql`;
      const filePath = path.join(migrationsDir, filename);

      // 检查文件是否已存在
      if (fs.existsSync(filePath)) {
        throw new Error(`Migration file already exists: ${filename}`);
      }

      // 生成模板内容
      let template = `-- Migration: ${migrationName}
-- Author: ${author}
-- Created: ${now.toISOString().split('T')[0]}
-- Version: ${version}

-- Use the database
USE \`my_app\`;

`;

      switch (migrationType) {
        case 'create_table':
          template += `-- Create new table
CREATE TABLE IF NOT EXISTS \`your_table_name\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
          break;

        case 'alter_table':
          template += `-- Alter existing table
-- ALTER TABLE \`your_table_name\` ADD COLUMN \`new_column\` VARCHAR(255);
-- ALTER TABLE \`your_table_name\` DROP COLUMN \`old_column\`;
-- ALTER TABLE \`your_table_name\` MODIFY COLUMN \`existing_column\` TEXT;
`;
          break;

        case 'insert_data':
          template += `-- Insert initial data
-- INSERT INTO \`your_table_name\` (\`column1\`, \`column2\`) VALUES
--   ('value1', 'value2'),
--   ('value3', 'value4');
`;
          break;

        case 'create_index':
          template += `-- Create indexes
-- CREATE INDEX \`idx_column_name\` ON \`your_table_name\` (\`column_name\`);
-- CREATE UNIQUE INDEX \`idx_unique_column\` ON \`your_table_name\` (\`unique_column\`);
`;
          break;

        default:
          template += `-- Add your custom SQL here
-- Remember to test your SQL before running migration

`;
      }

      template += `
-- Example:
-- CREATE TABLE test1 (id INT);
-- CREATE TABLE test2 (id INT);
`;

      // 写入文件
      fs.writeFileSync(filePath, template);

      console.log(chalk.green(`✓ Created migration file: ${filename}`));
      console.log(chalk.gray(`   Path: ${filePath}`));
      console.log(chalk.blue('\n📝 Next steps:'));
      console.log(chalk.gray('  1. Edit the migration file with your SQL'));
      console.log(chalk.gray('  2. Run "dbshift migrate" to execute the migration'));

    } catch (error) {
      throw error;
    } finally {
      // 重新创建 readline 接口以恢复所有功能，包括 Tab 补全
      this.recreateReadlineInterface();
    }
  }

  async handleConfigInit(env = 'development') {
    const fs = require('fs');
    const path = require('path');
    
    // 完全关闭 readline 输入监听，让 inquirer 完全接管
    this.rl.pause();
    this.rl.removeAllListeners('line');
    
    try {
      console.log(chalk.blue('⚙️  Initializing database configuration...'));

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
          const ConnectionTester = require('../lib/utils/connectionTester');
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

    } catch (error) {
      throw error;
    } finally {
      // 重新创建 readline 接口以恢复所有功能，包括 Tab 补全
      this.recreateReadlineInterface();
    }
  }

  async handleInitCommand() {
    const fs = require('fs');
    const path = require('path');
    
    // 完全关闭 readline 输入监听，让 inquirer 完全接管
    this.rl.pause();
    this.rl.removeAllListeners('line');
    
    try {
      console.log(chalk.blue('🚀 Initializing Schema Migration in current directory...'));

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

      let shouldSetupConfig = true;
      if (fs.existsSync(envPath) || fs.existsSync(configPath)) {
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
          shouldSetupConfig = false;
        }
      }

      // 只有在需要设置配置时才继续
      if (shouldSetupConfig) {
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

        console.log(chalk.blue('\n🎉 Database configuration initialized successfully!'));
      } else {
        console.log(chalk.blue('\n✅ Project structure is ready!'));
      }

      // 询问是否创建示例迁移文件
      const exampleFilename = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}01_Admin_example_migration.sql`;
      const examplePath = path.join(migrationsDir, exampleFilename);
      
      let shouldCreateExample = true;
      if (fs.existsSync(examplePath)) {
        const { createExample } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createExample',
            message: `Example migration file already exists (${exampleFilename}). Overwrite?`,
            default: false
          }
        ]);
        shouldCreateExample = createExample;
      } else {
        const { createExample } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createExample',
            message: 'Create example migration file?',
            default: true
          }
        ]);
        shouldCreateExample = createExample;
      }

      if (shouldCreateExample) {
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
      } else {
        console.log(chalk.yellow('⚠ Skipping example migration file creation'));
      }

      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.gray('  1. Edit your migration files in the migrations/ directory'));
      console.log(chalk.gray('  2. Run "dbshift migrate" to execute pending migrations'));
      console.log(chalk.gray('  3. Use "dbshift create <name>" to create new migration files'));

    } catch (error) {
      throw error;
    } finally {
      // 重新创建 readline 接口以恢复所有功能，包括 Tab 补全
      this.recreateReadlineInterface();
    }
  }

  showWelcome(showPrompt = true) {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════╗
║          DBShift v${packageInfo.version}              ║
║      Interactive Database Migration  ║
╚══════════════════════════════════════╝
`));
    console.log(chalk.gray('Type "/" + Tab for auto-completion, "/help" for help menu, or "q" to quit\n'));
    if (showPrompt) {
      this.rl.prompt();
    }
  }

  showMainMenu() {
    console.log(chalk.cyan('\n📋 Available Commands:'));
    console.log(chalk.gray('──────────────────────'));
    console.log(chalk.white('/              ') + chalk.gray('Interactive command selector (recommended)'));
    console.log(chalk.white('/init          ') + chalk.gray('Initialize new project'));
    console.log(chalk.white('/migrate       ') + chalk.gray('Run pending migrations'));
    console.log(chalk.white('/status        ') + chalk.gray('Show migration status'));
    console.log(chalk.white('/create        ') + chalk.gray('Create new migration'));
    console.log(chalk.white('/config        ') + chalk.gray('Configuration management'));
    console.log(chalk.white('/ping          ') + chalk.gray('Test database connection'));
    console.log(chalk.white('/help          ') + chalk.gray('Show this help menu'));
    console.log(chalk.white('/clear         ') + chalk.gray('Clear screen'));
    console.log(chalk.white('q              ') + chalk.gray('Quit interactive mode'));
    console.log();
    this.rl.prompt();
  }

  showConfigMenu() {
    console.log(chalk.cyan('\n⚙️  Configuration Commands:'));
    console.log(chalk.gray('────────────────────────'));
    console.log(chalk.white('/              ') + chalk.gray('Interactive command selector (recommended)'));
    console.log(chalk.white('/config show   ') + chalk.gray('Show current configuration'));
    console.log(chalk.white('/config init   ') + chalk.gray('Interactive configuration setup'));
    console.log(chalk.white('/config set    ') + chalk.gray('Set configuration values'));
    console.log(chalk.white('/back          ') + chalk.gray('Back to main menu'));
    console.log();
    this.rl.prompt();
  }

  async handleInput(input) {
    try {
      // 处理退出命令
      if (input === 'q' || input === 'quit' || input === 'exit') {
        this.rl.close();
        return;
      }

      // 处理清屏命令
      if (input === '/clear' || input === 'clear') {
        console.clear();
        this.showWelcome();
        return;
      }

      // 处理菜单命令
      if (input === '/') {
        // 显示交互式命令选择器
        this.showCommandSelector();
        return;
      }

      if (input === '/help' || input === 'help') {
        if (this.currentContext === 'config') {
          this.showConfigMenu();
        } else {
          this.showMainMenu();
        }
        return;
      }

      // 处理返回主菜单
      if (input === '/back' || input === 'back') {
        this.currentContext = 'main';
        console.log(chalk.green('📍 Back to main menu'));
        this.showMainMenu();
        return;
      }

      // 处理空输入
      if (!input) {
        this.rl.prompt();
        return;
      }

      // 处理数字选择（从命令选择器）
      if (/^\d+$/.test(input)) {
        const choice = this.handleNumberChoice(parseInt(input));
        if (choice) {
          // 递归调用 handleInput 处理选择的命令
          await this.handleInput(choice);
          return;
        } else {
          console.log(chalk.yellow('❓ Invalid choice. Please try again.'));
          this.rl.prompt();
          return;
        }
      }

      // 解析命令和参数
      const parts = input.split(' ');
      const command = parts[0];
      const args = parts.slice(1);

      // 路由命令处理
      await this.routeCommand(command, args);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }

    this.rl.prompt();
  }

  async routeCommand(command, args) {
    switch (command) {
      case '/init':
        console.log(chalk.blue('🚀 Initializing new project...'));
        try {
          await this.handleInitCommand();
          console.log(chalk.green('✅ Project initialized successfully!'));
        } catch (error) {
          console.error(chalk.red('❌ Failed to initialize project:'), error.message);
        }
        break;

      case '/migrate':
        console.log(chalk.blue('📦 Running migrations...'));
        try {
          const env = this.parseEnvFromArgs(args);
          await migrateCommand({ env });
          console.log(chalk.green('✅ Migrations completed successfully!'));
        } catch (error) {
          console.error(chalk.red('❌ Migration failed:'), error.message);
        }
        break;

      case '/status':
        try {
          const statusEnv = this.parseEnvFromArgs(args);
          await statusCommand({ env: statusEnv });
          console.log(chalk.green('✅ Status check completed!'));
        } catch (error) {
          console.error(chalk.red('❌ Failed to get status:'), error.message);
        }
        break;

      case '/create':
        if (args.length === 0) {
          console.log(chalk.yellow('⚠ Usage: /create <migration_name> [--author=<author>]'));
          break;
        }
        try {
          const migrationName = args[0];
          const author = this.parseAuthorFromArgs(args);
          console.log(chalk.blue(`📝 Creating migration: ${migrationName}`));
          
          // 在交互模式中直接处理迁移类型选择，避免嵌套 inquirer
          await this.handleCreateMigration(migrationName, author);
          console.log(chalk.green('✅ Migration file created successfully!'));
        } catch (error) {
          console.error(chalk.red('❌ Failed to create migration:'), error.message);
        }
        break;

      case '/config':
        if (args.length === 0) {
          this.currentContext = 'config';
          this.showConfigMenu();
          break;
        }
        try {
          await this.handleConfigCommand(args);
        } catch (error) {
          console.error(chalk.red('❌ Configuration failed:'), error.message);
        }
        break;

      case '/ping':
        console.log(chalk.blue('🏓 Testing database connection...'));
        try {
          const pingOptions = this.parsePingOptions(args);
          await testConnectionCommand(pingOptions);
        } catch (error) {
          console.error(chalk.red('❌ Connection test failed:'), error.message);
        }
        break;

      default:
        // 如果在 config 上下文中，尝试处理 config 子命令
        if (this.currentContext === 'config') {
          await this.handleConfigCommand([command.replace('/', ''), ...args]);
        } else {
          console.log(chalk.yellow(`❓ Unknown command: ${command}`));
          console.log(chalk.gray('Type "/" to see available commands'));
        }
        break;
    }
  }

  async handleConfigCommand(args) {
    const subCommand = args[0];
    const restArgs = args.slice(1);

    switch (subCommand) {
      case 'show':
        try {
          const env = this.parseEnvFromArgs(restArgs);
          await showConfigCommand({ env });
        } catch (error) {
          console.error(chalk.red('❌ Failed to show configuration:'), error.message);
        }
        break;

      case 'init':
        try {
          const initEnv = this.parseEnvFromArgs(restArgs);
          await this.handleConfigInit(initEnv);
          console.log(chalk.green('✅ Configuration initialized successfully!'));
        } catch (error) {
          console.error(chalk.red('❌ Failed to initialize configuration:'), error.message);
        }
        break;

      case 'set':
        console.log(chalk.yellow('⚠ Config set requires specific parameters. Use dbshiftcli for advanced config-set options.'));
        console.log(chalk.gray('Example: dbshiftcli config-set --host=localhost --user=root'));
        break;

      default:
        console.log(chalk.yellow(`❓ Unknown config command: ${subCommand}`));
        this.showConfigMenu();
        break;
    }
  }

  parseEnvFromArgs(args) {
    const envIndex = args.findIndex(arg => arg.startsWith('-e') || arg.startsWith('--env'));
    if (envIndex !== -1) {
      if (args[envIndex].includes('=')) {
        return args[envIndex].split('=')[1];
      } else if (args[envIndex + 1]) {
        return args[envIndex + 1];
      }
    }
    return 'development';
  }

  parseAuthorFromArgs(args) {
    const authorIndex = args.findIndex(arg => arg.startsWith('--author'));
    if (authorIndex !== -1) {
      if (args[authorIndex].includes('=')) {
        return args[authorIndex].split('=')[1];
      } else if (args[authorIndex + 1]) {
        return args[authorIndex + 1];
      }
    }
    return 'Admin';
  }

  parsePingOptions(args) {
    const options = { env: 'development' };

    args.forEach(arg => {
      if (arg.startsWith('--host=')) options.host = arg.split('=')[1];
      if (arg.startsWith('--port=')) options.port = arg.split('=')[1];
      if (arg.startsWith('--user=')) options.user = arg.split('=')[1];
      if (arg.startsWith('--password=')) options.password = arg.split('=')[1];
      if (arg.startsWith('-e=') || arg.startsWith('--env=')) options.env = arg.split('=')[1];
    });

    return options;
  }

  start() {
    this.showWelcome();
  }
}

// 设置交互模式标志
process.env.DBSHIFT_INTERACTIVE_MODE = 'true';

// 添加全局错误处理器，防止未捕获的异常导致进程退出
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  console.error(chalk.gray('💡 This is likely a bug. Please report it at https://github.com/greddy7574/dbshift/issues'));
  // 在交互模式下不退出，让用户继续操作
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Promise Rejection:'), reason);
  console.error(chalk.gray('💡 This is likely a bug. Please report it at https://github.com/greddy7574/dbshift/issues'));
  // 在交互模式下不退出，让用户继续操作
});

// 启动交互模式
const interactive = new DBShiftInteractive();
interactive.start();

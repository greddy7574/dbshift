#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const package = require('../package.json');

// 导入命令处理器
const initCommand = require('../lib/commands/init');
const migrateCommand = require('../lib/commands/migrate');
const statusCommand = require('../lib/commands/status');
const createCommand = require('../lib/commands/create');
const historyCommand = require('../lib/commands/history');
const showConfigCommand = require('../lib/commands/config/index');
const configInitCommand = require('../lib/commands/config/init');
const configSetCommand = require('../lib/commands/config/set');
const testConnectionCommand = require('../lib/commands/test-connection');

// 设置程序信息
program
  .name('dbshift')
  .description('Database schema migration tool inspired by Flyway')
  .version(package.version, '-v, --version', 'display version number')
  .addHelpText('after', `
Configuration commands:
  config                 Show current configuration
  config-init            Interactive configuration setup  
  config-set             Set specific configuration values
  ping                   Test database connection

Configuration examples:
  dbshift config                                    # Show current config
  dbshift config-init                               # Interactive setup
  dbshift config-set --host=localhost --user=root  # Set values directly
  dbshift config-set --host=prod-host -e production # Set production config
  dbshift ping                                      # Test current config
  dbshift ping --host=localhost --user=root        # Test custom params

Configuration formats:
  .env file              Simple key=value format, good for production
  schema.config.js       JavaScript config with multiple environments

Environment variables (for production):
  MYSQL_HOST            Database host
  MYSQL_PORT            Database port (default: 3306)
  MYSQL_USERNAME        Database username
  MYSQL_PASSWORD        Database password

Migration file naming:
  YYYYMMDDNN_Author_description.sql
  Example: 20241220001_Admin_create_users_table.sql

For more information, visit: https://github.com/greddy7574/dbshift`);

// init 命令
program
  .command('init')
  .description('Initialize schema migration in current directory')
  .addHelpText('after', '\nCreates migrations/ directory and configuration files (.env or schema.config.js)')
  .action(initCommand);

// migrate 命令
program
  .command('migrate')
  .description('Run pending migrations')
  .option('-e, --env <environment>', 'specify environment (default: development)')
  .addHelpText('after', '\nExamples:\n  dbshift migrate\n  dbshift migrate -e production\n  dbshift migrate --env staging')
  .action(migrateCommand);

// status 命令
program
  .command('status')
  .description('Show migration status (completed/pending)')
  .option('-e, --env <environment>', 'specify environment (default: development)')
  .addHelpText('after', '\nShows which migrations have been executed and which are pending')
  .action(statusCommand);

// history 命令
program
  .command('history')
  .description('Show detailed migration execution history')
  .option('-e, --env <environment>', 'specify environment (default: development)')
  .option('-a, --author <author>', 'filter history by author name')
  .addHelpText('after', '\nExamples:\n  dbshift history\n  dbshift history --author=John\n  dbshift history -e production')
  .action(historyCommand);

// create 命令
program
  .command('create <name>')
  .description('Create a new migration file with timestamp')
  .option('-a, --author <author>', 'specify author name (default: Admin)')
  .addHelpText('after', '\nExamples:\n  dbshift create create_users_table\n  dbshift create add_user_index -a John')
  .action(createCommand);

// config 命令 (显示配置)
program
  .command('config')
  .description('Show current database configuration')
  .option('-e, --env <environment>', 'specify environment (default: development)', 'development')
  .addHelpText('after', '\nShows current configuration for the specified environment')
  .action(showConfigCommand);

// config-init 命令 (交互式配置)
program
  .command('config-init')
  .description('Interactive database configuration setup')
  .option('-e, --env <environment>', 'specify environment (default: development)', 'development')
  .addHelpText('after', '\nInteractive setup for database credentials and connection settings')
  .action(configInitCommand);

// config-set 命令 (设置配置)
program
  .command('config-set')
  .description('Set database configuration values')
  .option('-e, --env <environment>', 'specify environment (default: development)', 'development')
  .option('--host <host>', 'database host')
  .option('--port <port>', 'database port')
  .option('--user <user>', 'database username')
  .option('--password <password>', 'database password')
  .addHelpText('after', '\nExamples:\n  dbshift config-set --host=localhost --user=root --password=123456\n  dbshift config-set --host=prod-host -e production')
  .action(configSetCommand);

// ping 命令 (测试数据库连接)
program
  .command('ping')
  .description('Test database connection')
  .option('-e, --env <environment>', 'specify environment (default: development)', 'development')
  .option('--host <host>', 'database host (temporary test, not saved)')
  .option('--port <port>', 'database port (temporary test, not saved)')
  .option('--user <user>', 'database username (temporary test, not saved)')
  .option('--password <password>', 'database password (temporary test, not saved)')
  .addHelpText('after', '\nExamples:\n  dbshift ping                                     # Test current config\n  dbshift ping -e production                       # Test production config\n  dbshift ping --host=localhost --user=root       # Test custom parameters')
  .action(testConnectionCommand);

// 错误处理
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// 解析命令行参数
program.parse();

// 如果没有提供任何命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
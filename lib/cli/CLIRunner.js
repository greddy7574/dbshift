function executeCommandLine(command) {
    // 动态导入 commander 和相关模块
    const { program } = require('commander');
    const chalk = require('chalk');
    const package = require('../../package.json');

    // 导入命令处理器
    const initCommand = require('../commands/init');
    const migrateCommand = require('../commands/migrate');
    const statusCommand = require('../commands/status');
    const createCommand = require('../commands/create');
    const historyCommand = require('../commands/history');
    const showConfigCommand = require('../commands/config/index');
    const configInitCommand = require('../commands/config/init');
    const configSetCommand = require('../commands/config/set');
    const testConnectionCommand = require('../commands/test-connection');

    // 设置程序信息
    program
        .name('dbshift')
        .description('Database schema migration tool inspired by Flyway')
        .version(package.version, '-v, --version', 'display version number');

    // 添加所有命令
    program
        .command('init')
        .description('Initialize migration environment')
        .action(initCommand);

    program
        .command('migrate')
        .description('Run pending migrations')
        .option('-e, --env <env>', 'Environment to migrate (default: development)')
        .action(migrateCommand);

    program
        .command('status')
        .description('Show migration status')
        .option('-e, --env <env>', 'Environment to check (default: development)')
        .action(statusCommand);

    program
        .command('create <name>')
        .description('Create a new migration file')
        .option('--author <author>', 'Author name (default: Admin)')
        .option('-a <author>', 'Author name (short form)')
        .action(createCommand);

    program
        .command('history')
        .description('Show migration execution history')
        .option('-e, --env <env>', 'Environment to check (default: development)')
        .option('--author <author>', 'Filter by author name')
        .option('-a <author>', 'Filter by author name (short form)')
        .action(historyCommand);

    program
        .command('config')
        .description('Show current configuration')
        .option('-e, --env <env>', 'Environment to show (default: development)')
        .action(showConfigCommand);

    program
        .command('config-init')
        .description('Interactive configuration setup')
        .action(configInitCommand);

    program
        .command('config-set')
        .description('Set configuration values')
        .option('--host <host>', 'Database host')
        .option('--port <port>', 'Database port')
        .option('--user <user>', 'Database user')
        .option('--password <password>', 'Database password')
        .option('--database <database>', 'Database name')
        .option('-e, --env <env>', 'Environment to configure (default: development)')
        .action(configSetCommand);

    program
        .command('ping')
        .description('Test database connection')
        .option('-e, --env <env>', 'Environment to test (default: development)')
        .option('--host <host>', 'Database host (overrides config)')
        .option('--port <port>', 'Database port (overrides config)')
        .option('--user <user>', 'Database user (overrides config)')
        .option('--password <password>', 'Database password (overrides config)')
        .option('--database <database>', 'Database name (overrides config)')
        .action(testConnectionCommand);

    program
        .command('about')
        .description('Show version information')
        .action(() => {
            console.log('About DBShift CLI');
            console.log('');
            console.log('CLI Version      ' + package.version);
            console.log('Database         MySQL');
            console.log('Framework        Node.js');
            console.log('Migration Tool   Flyway-inspired');
            console.log('License          MIT');
            console.log('Author           greddy7574');
        });

    // 解析命令
    const commandArgs = command.split(' ');
    process.argv = ['node', 'dbshift', ...commandArgs];
    program.parse();
}

module.exports = { executeCommandLine };
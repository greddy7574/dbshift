#!/usr/bin/env node

// 检查是否为指令模式
const args = process.argv.slice(2);
const pIndex = args.indexOf('-p');

// 检查帮助参数
if (args.includes('-h') || args.includes('--help') || args.includes('-help')) {
    showHelp();
    process.exit(0);
}

if (pIndex !== -1) {
    // 指令模式：dbshift -p -- command args
    const separatorIndex = args.indexOf('--');
    if (separatorIndex !== -1 && separatorIndex > pIndex) {
        const command = args.slice(separatorIndex + 1).join(' ');
        executeCommandLine(command);
    } else {
        console.error('Error: Use format "dbshift -p -- command args"');
        console.error('Example: dbshift -p -- create "test migration"');
        console.error('Example: dbshift -p -- config-set --host=localhost --user=root');
        process.exit(1);
    }
} else {
    // 交互模式
    startInteractiveMode();
}

function showHelp() {
    const chalk = require('chalk');
    const package = require('../package.json');

    console.log(`${chalk.cyan('DBShift')} ${chalk.gray('v' + package.version)}`);
    console.log('Database schema migration tool inspired by Flyway');
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  dbshift                    Start interactive mode');
    console.log('  dbshift -p -- <command>    Execute command in CLI mode');
    console.log('  dbshift -h, --help         Show this help message');
    console.log('');
    console.log(chalk.yellow('Interactive Mode:'));
    console.log('  dbshift                    Launch interactive terminal UI');
    console.log('  - Real-time command suggestions');
    console.log('  - Arrow key command history');
    console.log('  - Tab completion');
    console.log('  - Real database integration');
    console.log('');
    console.log(chalk.yellow('CLI Mode Examples:'));
    console.log('  dbshift -p -- init                           Initialize project');
    console.log('  dbshift -p -- create "add user table"       Create migration');
    console.log('  dbshift -p -- migrate                        Run migrations');
    console.log('  dbshift -p -- status                         Show status');
    console.log('  dbshift -p -- history                        Show history');
    console.log('  dbshift -p -- config                         Show config');
    console.log('  dbshift -p -- ping                           Test connection');
    console.log('');
    console.log(chalk.yellow('CLI Mode with Parameters:'));
    console.log('  dbshift -p -- create "test migration" --author=john');
    console.log('  dbshift -p -- config-set --host=localhost --user=root');
    console.log('  dbshift -p -- history --author=admin');
    console.log('  dbshift -p -- ping --host=localhost --user=test');
    console.log('');
    console.log(chalk.yellow('Note:'));
    console.log('  Use "--" separator to avoid quote conflicts in CLI mode');
    console.log('  Interactive mode provides the best user experience');
    console.log('  CLI mode is ideal for scripting and automation');
    console.log('');
    console.log(chalk.gray('For more information, visit: https://github.com/greddy7574/dbshift'));
}

function executeCommandLine(command) {
    const { executeCommandLine } = require('../lib/cli/CLIRunner');
    executeCommandLine(command);
}

function startInteractiveMode() {
    const { startInteractiveMode } = require('../lib/ui/InteractiveApp');
    startInteractiveMode();
}
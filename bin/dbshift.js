#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
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
      prompt: chalk.blue('dbshift> ')
    });
    
    this.currentContext = 'main';
    this.setupReadline();
  }

  setupReadline() {
    this.rl.on('line', async (line) => {
      await this.handleInput(line.trim());
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye! 👋'));
      process.exit(0);
    });
  }

  showWelcome() {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════╗
║          DBShift v${packageInfo.version}           ║
║      Interactive Database Migration   ║
╚══════════════════════════════════════╝
`));
    console.log(chalk.gray('Type "/" to see available commands, or "q" to quit\n'));
    this.rl.prompt();
  }

  showMainMenu() {
    console.log(chalk.cyan('\n📋 Available Commands:'));
    console.log(chalk.gray('──────────────────────'));
    console.log(chalk.white('/init          ') + chalk.gray('Initialize new project'));
    console.log(chalk.white('/migrate       ') + chalk.gray('Run pending migrations'));
    console.log(chalk.white('/status        ') + chalk.gray('Show migration status'));
    console.log(chalk.white('/create        ') + chalk.gray('Create new migration'));
    console.log(chalk.white('/config        ') + chalk.gray('Configuration management'));
    console.log(chalk.white('/ping          ') + chalk.gray('Test database connection'));
    console.log(chalk.white('/help          ') + chalk.gray('Show detailed help'));
    console.log(chalk.white('/clear         ') + chalk.gray('Clear screen'));
    console.log(chalk.white('q              ') + chalk.gray('Quit interactive mode'));
    console.log();
    this.rl.prompt();
  }

  showConfigMenu() {
    console.log(chalk.cyan('\n⚙️  Configuration Commands:'));
    console.log(chalk.gray('────────────────────────'));
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
      if (input === '/' || input === '/help' || input === 'help') {
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
        await initCommand();
        console.log(chalk.green('✅ Project initialized successfully!'));
        break;

      case '/migrate':
        console.log(chalk.blue('📦 Running migrations...'));
        const env = this.parseEnvFromArgs(args);
        await migrateCommand({ env });
        break;

      case '/status':
        console.log(chalk.blue('📊 Checking migration status...'));
        const statusEnv = this.parseEnvFromArgs(args);
        await statusCommand({ env: statusEnv });
        break;

      case '/create':
        if (args.length === 0) {
          console.log(chalk.yellow('⚠ Usage: /create <migration_name> [--author=<author>]'));
          break;
        }
        const migrationName = args[0];
        const author = this.parseAuthorFromArgs(args);
        console.log(chalk.blue(`📝 Creating migration: ${migrationName}`));
        await createCommand(migrationName, { author });
        break;

      case '/config':
        if (args.length === 0) {
          this.currentContext = 'config';
          this.showConfigMenu();
          break;
        }
        await this.handleConfigCommand(args);
        break;

      case '/ping':
        console.log(chalk.blue('🏓 Testing database connection...'));
        const pingOptions = this.parsePingOptions(args);
        await testConnectionCommand(pingOptions);
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
        const env = this.parseEnvFromArgs(restArgs);
        await showConfigCommand({ env });
        break;

      case 'init':
        const initEnv = this.parseEnvFromArgs(restArgs);
        await configInitCommand({ env: initEnv });
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

// 启动交互模式
const interactive = new DBShiftInteractive();
interactive.start();
#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const inquirer = require('inquirer');
const packageInfo = require('../package.json');

// 啟用 keypress 事件支持 - 不使用 raw mode，讓 readline 處理
readline.emitKeypressEvents(process.stdin);

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

      // 如果只有一個匹配，直接返回
      if (hits.length === 1) {
        return [hits, line];
      }

      // 如果有多個匹配，顯示所有選項
      if (hits.length > 1) {
        // 清除當前行並顯示所有可用選項
        console.log('\n');
        console.log(chalk.blue('📋 Available Commands:'));
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

        return [hits, line];
      }

      return [hits, line];
    }

    // 如果沒有輸入 "/"，提示使用斜槓命令
    if (line === '') {
      console.log('\n');
      console.log(chalk.blue('💡 Available options:'));
      console.log(`${chalk.cyan('/')} ${chalk.gray('                   Show command menu')}`);
      console.log(`${chalk.cyan('/[command] + Tab')} ${chalk.gray('   Auto-complete commands')}`);
      console.log(`${chalk.cyan('q')} ${chalk.gray('                   Quit interactive mode')}`);
      console.log();
      return [[], line];
    }

    return [[], line];
  }

  setupReadline() {
    // 啟用即時按鍵監聽
    this.currentInput = '';
    this.isShowingLiveCommands = false;
    
    // 使用 readline 的內建事件來監聽輸入變化
    this.rl.on('SIGINT', () => {
      this.hideLiveCommands();
      console.log(chalk.yellow('\nGoodbye! 👋'));
      process.exit(0);
    });
    
    // 攔截 readline 的輸出來檢測輸入變化
    const originalWrite = this.rl._writeToOutput;
    this.rl._writeToOutput = (stringToWrite) => {
      // 執行原始寫入
      const result = originalWrite.call(this.rl, stringToWrite);
      
      // 在下一個事件循環中檢查輸入變化
      setImmediate(() => {
        const currentLine = this.rl.line || '';
        this.updateLiveCommandsForInput(currentLine);
      });
      
      return result;
    };

    this.rl.on('line', async (line) => {
      this.hideLiveCommands();
      await this.handleInput(line.trim());
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye! 👋'));
      process.exit(0);
    });
  }

  updateLiveCommandsForInput(input) {
    // 更新當前輸入狀態
    this.currentInput = input;
    
    // 當輸入以 "/" 開始時顯示即時命令過濾
    if (input.startsWith('/')) {
      this.showLiveCommands(input);
    } else if (this.isShowingLiveCommands) {
      this.hideLiveCommands();
    }
  }

  showLiveCommands(filter = '/') {
    const currentCommands = this.currentContext === 'config' 
      ? this.commands.config 
      : this.commands.main;
    
    // 過濾匹配的命令
    const filteredCommands = currentCommands.filter(cmd => 
      cmd.command.startsWith(filter)
    );
    
    if (filteredCommands.length === 0) {
      if (this.isShowingLiveCommands) {
        this.hideLiveCommands();
      }
      return;
    }
    
    // 如果命令列表沒有變化，不重新繪製
    if (this.isShowingLiveCommands && this.lastFilteredCommands && 
        JSON.stringify(this.lastFilteredCommands) === JSON.stringify(filteredCommands)) {
      return;
    }
    
    // 清除之前的顯示
    if (this.isShowingLiveCommands) {
      // 移動光標上移並清除從光標到螢幕底部的內容
      const linesToClear = this.lastCommandCount + 4; // 命令數量 + 標題 + 分隔線 + 提示行
      for (let i = 0; i < linesToClear; i++) {
        process.stdout.write('\x1b[1A'); // 上移一行
        process.stdout.write('\x1b[2K'); // 清除整行
      }
    }
    
    // 顯示過濾後的命令
    console.log('\n' + chalk.blue('📋 Available Commands:'));
    console.log('─'.repeat(60));
    
    filteredCommands.forEach(cmd => {
      const commandPart = chalk.cyan(cmd.command.padEnd(20));
      const descPart = chalk.gray(cmd.description);
      console.log(`  ${commandPart} ${descPart}`);
    });
    
    console.log('─'.repeat(60));
    console.log(chalk.yellow(`💡 Found ${filteredCommands.length} matching command(s). Press Enter to select or ESC to cancel.`));
    
    this.isShowingLiveCommands = true;
    this.lastCommandCount = filteredCommands.length;
    this.lastFilteredCommands = filteredCommands;
    
    // 重新顯示輸入提示符但不輸出，讓 readline 處理
    // readline 會自動顯示當前輸入
  }

  hideLiveCommands() {
    if (this.isShowingLiveCommands) {
      // 清除命令列表顯示
      const linesToClear = this.lastCommandCount + 4;
      for (let i = 0; i < linesToClear; i++) {
        process.stdout.write('\x1b[1A'); // 上移一行
        process.stdout.write('\x1b[2K'); // 清除整行
      }
      this.isShowingLiveCommands = false;
    }
  }

  async showCommandSelector() {
    // 暂时关闭当前的 readline 接口
    this.rl.pause();

    let choices;
    if (this.currentContext === 'config') {
      choices = [
        { name: '/config show         Show current configuration', value: '/config show' },
        { name: '/config init         Interactive configuration setup', value: '/config init' },
        { name: '/config set          Set configuration values', value: '/config set' },
        { name: '/back                Back to main menu', value: '/back' },
        { name: 'Cancel                Exit menu', value: 'cancel' }
      ];
    } else {
      choices = [
        { name: '/init                Initialize new project', value: '/init' },
        { name: '/migrate             Run pending migrations', value: '/migrate' },
        { name: '/status              Show migration status', value: '/status' },
        { name: '/create              Create new migration', value: '/create', needsInput: true },
        { name: '/config              Configuration management', value: '/config' },
        { name: '/ping                Test database connection', value: '/ping' },
        { name: '/clear               Clear screen', value: '/clear' },
        { name: '/help                Show help menu', value: '/help' },
        { name: 'Cancel                Exit menu', value: 'cancel' }
      ];
    }

    try {
      const { command } = await inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'Select a command:',
          choices: choices,
          pageSize: 10
        }
      ]);

      // 恢复 readline 接口
      this.rl.resume();

      if (command === 'cancel') {
        this.rl.prompt();
        return;
      }

      // 处理需要额外输入的命令
      if (command === '/create') {
        await this.handleCreateCommand();
        return;
      }

      // 处理其他选择的命令
      await this.handleInput(command);
    } catch (error) {
      // 恢复 readline 接口
      this.rl.resume();
      console.error(chalk.red('❌ Error:'), error.message);
      this.rl.prompt();
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

      const command = `/create ${answers.migrationName} --author=${answers.author}`;
      console.log(chalk.blue(`📝 Creating migration: ${answers.migrationName}`));
      await this.handleInput(command);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      this.rl.prompt();
    }
  }

  showWelcome() {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════╗
║          DBShift v${packageInfo.version}              ║
║      Interactive Database Migration  ║
╚══════════════════════════════════════╝
`));
    console.log(chalk.gray('Type "/" + Tab for auto-completion, "/help" for help menu, or "q" to quit\n'));
    this.rl.prompt();
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
        await this.showCommandSelector();
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
          await initCommand();
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
          await createCommand(migrationName, { author });
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
          await configInitCommand({ env: initEnv });
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

// 启动交互模式
const interactive = new DBShiftInteractive();
interactive.start();

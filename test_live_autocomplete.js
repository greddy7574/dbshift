#!/usr/bin/env node

// 測試即時自動補全功能
const readline = require('readline');
const chalk = require('chalk');

console.log(chalk.blue('測試即時自動補全功能'));
console.log(chalk.gray('請輸入 "/" 來查看是否顯示命令列表'));
console.log(chalk.gray('請輸入 "/i" 來查看是否過濾到 init 命令'));
console.log(chalk.gray('按 Ctrl+C 退出'));

class TestAutoComplete {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('test> ')
    });

    this.commands = [
      { command: '/init', description: 'Initialize new project' },
      { command: '/migrate', description: 'Run pending migrations' },
      { command: '/status', description: 'Show migration status' },
      { command: '/create', description: 'Create new migration' }
    ];

    this.isShowingCommands = false;
    this.lastCommandCount = 0;

    this.setupEvents();
    this.rl.prompt();
  }

  setupEvents() {
    // 監聽 keypress 事件
    this.rl.input.on('keypress', (str, key) => {
      if (!key) return;
      
      // 延遲處理以確保 readline 更新了緩衝區
      setImmediate(() => {
        const currentLine = this.rl.line || '';
        this.handleInput(currentLine);
      });
    });

    this.rl.on('line', (input) => {
      this.hideCommands();
      console.log(chalk.green(`你輸入了: ${input}`));
      this.rl.prompt();
    });

    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n再見!'));
      process.exit(0);
    });
  }

  handleInput(input) {
    if (input.startsWith('/')) {
      this.showFilteredCommands(input);
    } else if (this.isShowingCommands) {
      this.hideCommands();
    }
  }

  showFilteredCommands(filter) {
    const filtered = this.commands.filter(cmd => cmd.command.startsWith(filter));
    
    if (filtered.length === 0) {
      if (this.isShowingCommands) {
        this.hideCommands();
      }
      return;
    }

    // 清除之前的顯示
    if (this.isShowingCommands) {
      const linesToClear = this.lastCommandCount + 3;
      for (let i = 0; i < linesToClear; i++) {
        process.stdout.write('\x1b[1A'); // 上移一行
        process.stdout.write('\x1b[2K'); // 清除整行
      }
    }

    // 顯示過濾的命令
    console.log(chalk.blue('📋 可用命令:'));
    console.log('─'.repeat(50));
    
    filtered.forEach(cmd => {
      console.log(`  ${chalk.cyan(cmd.command.padEnd(15))} ${chalk.gray(cmd.description)}`);
    });
    
    console.log('─'.repeat(50));

    this.isShowingCommands = true;
    this.lastCommandCount = filtered.length;

    // 重新顯示提示符
    process.stdout.write(chalk.blue('test> ') + filter);
  }

  hideCommands() {
    if (this.isShowingCommands) {
      const linesToClear = this.lastCommandCount + 3;
      for (let i = 0; i < linesToClear; i++) {
        process.stdout.write('\x1b[1A');
        process.stdout.write('\x1b[2K');
      }
      this.isShowingCommands = false;
    }
  }
}

new TestAutoComplete();
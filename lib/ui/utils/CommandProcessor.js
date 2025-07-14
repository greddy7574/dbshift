// 导入现有的命令处理器
const initCommand = require('../../commands/init');
const migrateCommand = require('../../commands/migrate');
const statusCommand = require('../../commands/status');
const createCommand = require('../../commands/create');
const historyCommand = require('../../commands/history');
const showConfigCommand = require('../../commands/config/index');
const configInitCommand = require('../../commands/config/init');
const testConnectionCommand = require('../../commands/test-connection');

class CommandProcessor {
  constructor() {
    // 设置交互模式标志
    process.env.DBSHIFT_INTERACTIVE_MODE = 'true';
    
    this.commands = {
      '/init': {
        description: 'Initialize new project',
        handler: this.handleInit.bind(this),
        category: 'setup',
        isInteractive: true
      },
      '/migrate': {
        description: 'Run pending migrations',
        handler: this.handleMigrate.bind(this),
        category: 'migration'
      },
      '/status': {
        description: 'Show migration status',
        handler: this.handleStatus.bind(this),
        category: 'info'
      },
      '/history': {
        description: 'Show migration execution history',
        handler: this.handleHistory.bind(this),
        category: 'info'
      },
      '/create': {
        description: 'Create new migration',
        handler: this.handleCreate.bind(this),
        category: 'migration'
      },
      '/config': {
        description: 'Show configuration',
        handler: this.handleConfig.bind(this),
        category: 'config'
      },
      '/config-init': {
        description: 'Initialize configuration',
        handler: this.handleConfigInit.bind(this),
        category: 'config',
        isInteractive: true
      },
      '/ping': {
        description: 'Test database connection',
        handler: this.handlePing.bind(this),
        category: 'config'
      }
    };
  }

  async processCommand(input) {
    const { command, args } = this.parseCommand(input);

    if (!this.commands[command]) {
      return {
        success: false,
        message: `❓ Unknown command: ${command}`,
        details: [`Available commands: ${Object.keys(this.commands).join(', ')}`]
      };
    }

    try {
      const result = await this.commands[command].handler(args);
      return {
        success: true,
        message: result.message || '✅ Command completed successfully',
        details: result.details
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Command failed: ${error.message}`,
        details: error.details || []
      };
    }
  }

  parseCommand(input) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    // 解析常见参数
    const parsedArgs = {
      raw: args,
      env: this.parseArgument(args, ['-e', '--env']) || 'development',
      author: this.parseArgument(args, ['-a', '--author']) || 'Admin',
      help: args.includes('--help') || args.includes('-h')
    };

    return { command, args: parsedArgs };
  }

  parseArgument(args, flags) {
    for (const flag of flags) {
      const index = args.findIndex(arg => arg === flag || arg.startsWith(flag + '='));
      if (index !== -1) {
        if (args[index].includes('=')) {
          return args[index].split('=')[1];
        } else if (args[index + 1]) {
          return args[index + 1];
        }
      }
    }
    return null;
  }

  getCommandInfo(command) {
    return this.commands[command];
  }

  getSuggestions(partial) {
    const matchingCommands = Object.entries(this.commands)
      .filter(([cmd]) => cmd.startsWith(partial))
      .map(([cmd, info]) => ({
        command: cmd,
        description: info.description,
        category: info.category
      }));

    return matchingCommands;
  }

  // 命令处理器包装方法
  async handleInit(args) {
    try {
      await initCommand();
      return {
        message: '🚀 Project initialized successfully!',
        details: [
          'Created migrations directory',
          'Configuration file created',
          'Ready to create your first migration'
        ]
      };
    } catch (error) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async handleMigrate(args) {
    try {
      await migrateCommand({ env: args.env });
      return {
        message: '📦 Migrations completed successfully!',
        details: ['All pending migrations have been applied']
      };
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  async handleStatus(args) {
    try {
      // 捕获输出用于返回详细信息
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      await statusCommand({ env: args.env });
      
      // 恢复原始 console.log
      console.log = originalLog;

      return {
        message: '📊 Status check completed',
        details: output.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  async handleHistory(args) {
    try {
      await historyCommand({ env: args.env, author: args.author });
      return {
        message: '📜 Migration history loaded',
        details: ['Use filters to narrow down results']
      };
    } catch (error) {
      throw new Error(`History loading failed: ${error.message}`);
    }
  }

  async handleCreate(args) {
    const migrationName = args.raw[0];
    if (!migrationName) {
      throw new Error('Migration name is required. Usage: /create <migration_name>');
    }

    try {
      await createCommand(migrationName, { author: args.author });
      return {
        message: `📝 Migration "${migrationName}" created successfully!`,
        details: [
          `Author: ${args.author}`,
          'Edit the migration file with your SQL',
          'Run /migrate to apply the migration'
        ]
      };
    } catch (error) {
      throw new Error(`Migration creation failed: ${error.message}`);
    }
  }

  async handleConfig(args) {
    try {
      await showConfigCommand({ env: args.env });
      return {
        message: '⚙️ Configuration displayed',
        details: ['Use /config-init to modify settings']
      };
    } catch (error) {
      throw new Error(`Configuration display failed: ${error.message}`);
    }
  }

  async handleConfigInit(args) {
    try {
      await configInitCommand({ env: args.env });
      return {
        message: '⚙️ Configuration initialized successfully!',
        details: [
          'Database connection configured',
          'Test the connection with /ping'
        ]
      };
    } catch (error) {
      throw new Error(`Configuration initialization failed: ${error.message}`);
    }
  }

  async handlePing(args) {
    try {
      await testConnectionCommand({ env: args.env });
      return {
        message: '🏓 Database connection test completed',
        details: ['Connection is working properly']
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }
}

module.exports = { CommandProcessor };
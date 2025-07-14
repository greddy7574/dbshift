const React = require('react');
const { render, Box, useInput, useApp, Spacer, Static } = require('ink');
const { useStdout } = require('ink');
const { useState, useEffect, useCallback } = React;
const package = require('../../package.json');

// Import dialog components
const InitDialog = require('./components/dialogs/InitDialog');
const CreateDialog = require('./components/dialogs/CreateDialog');
const ConfigDialog = require('./components/dialogs/ConfigDialog');
const ConfigInitDialog = require('./components/dialogs/ConfigInitDialog');
const ConfigSetDialog = require('./components/dialogs/ConfigSetDialog');
const Config = require('../core/config');

// Import layout components
const {
    DBShiftLogo,
    WelcomeTips,
    InputBox,
    UserInputBox,
    CommandOutputBox,
    CommandSuggestions
} = require('./components/Layout');

function startInteractiveMode() {
    // 检查是否支持交互模式
    if (!process.stdin.isTTY) {
        console.log('🚀 DBShift Interactive Mode');
        console.log('');
        console.log('❌ Interactive mode requires a terminal (TTY)');
        console.log('💡 Use CLI mode instead: dbshift -p -- <command>');
        console.log('');
        console.log('Examples:');
        console.log('  dbshift -p -- status');
        console.log('  dbshift -p -- create "test migration"');
        console.log('  dbshift -p -- migrate');
        console.log('');
        console.log('For help: dbshift --help');
        process.exit(1);
    }

    // 捕获控制台输出的辅助函数
    const captureConsoleOutput = (fn) => {
        const originalLog = console.log;
        const originalError = console.error;
        const outputs = [];

        console.log = (...args) => {
            outputs.push({ type: 'info', content: args.join(' ') });
            originalLog(...args);
        };

        console.error = (...args) => {
            outputs.push({ type: 'error', content: args.join(' ') });
            originalError(...args);
        };

        return new Promise((resolve) => {
            Promise.resolve(fn()).then(() => {
                console.log = originalLog;
                console.error = originalError;
                resolve(outputs);
            }).catch((error) => {
                console.log = originalLog;
                console.error = originalError;
                outputs.push({ type: 'error', content: error.message });
                resolve(outputs);
            });
        });
    };

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

    // 设置交互模式环境变量
    process.env.DBSHIFT_INTERACTIVE_MODE = 'true';

    // 持久化历史记录管理
    const HISTORY_FILE = '.dbshift_history';
    const MAX_HISTORY_SIZE = 1000; // 增加历史记录容量到1000条
    
    const loadHistory = () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const historyPath = path.join(process.cwd(), HISTORY_FILE);
            
            // 🔄 每次启动时清空历史记录文件，开始全新的会话
            if (fs.existsSync(historyPath)) {
                fs.writeFileSync(historyPath, '', 'utf8'); // 清空文件内容
            }
            
            // 返回空的历史记录数组，开始新会话
            return [];
        } catch (error) {
            // 忽略历史记录处理错误，继续正常运行
        }
        return [];
    };
    
    const saveHistory = (newHistory) => {
        try {
            const fs = require('fs');
            const path = require('path');
            const historyPath = path.join(process.cwd(), HISTORY_FILE);
            
            // 保持完整顺序，允许重复命令，只限制大小
            const limitedHistory = newHistory.slice(-MAX_HISTORY_SIZE); // 保留最新的记录
            
            fs.writeFileSync(historyPath, limitedHistory.join('\n') + '\n', 'utf8');
        } catch (error) {
            // 忽略历史记录保存错误，继续正常运行
        }
    };

    // 主应用组件 - 加入 Gemini CLI 风格的布局控制
    const DBShiftApp = () => {
        const [input, setInput] = useState('');
        const [cursorPosition, setCursorPosition] = useState(0); // New state for cursor position
        const [conversations, setConversations] = useState([]);
        const [suggestions, setSuggestions] = useState([]);
        const [selectedSuggestion, setSelectedSuggestion] = useState(0);
        const [scrollOffset, setScrollOffset] = useState(0); // New state for scroll offset
        const VISIBLE_SUGGESTIONS_COUNT = 8; // New constant for visible suggestions
        const [history, setHistory] = useState(() => loadHistory()); // 启动时加载历史记录
        const [historyIndex, setHistoryIndex] = useState(-1);
        const [isProcessing, setIsProcessing] = useState(false);
        const [showSuggestions, setShowSuggestions] = useState(false);
        // 对话框状态管理
        const [showInitDialog, setShowInitDialog] = useState(false);
        const [showCreateDialog, setShowCreateDialog] = useState(false); // New state for CreateDialog
        const [showConfigDialog, setShowConfigDialog] = useState(false); // New state for ConfigDialog
        const [showConfigInitDialog, setShowConfigInitDialog] = useState(false); // New state for ConfigInitDialog
        const [showConfigSetDialog, setShowConfigSetDialog] = useState(false); // New state for ConfigSetDialog

        const { exit } = useApp();
        const { stdout } = useStdout();

        // 捕获控制台输出的辅助函数 - 移到前面避免引用错误
        const captureConsoleOutput = useCallback((fn) => {
            const originalLog = console.log;
            const originalError = console.error;
            const outputs = [];

            console.log = (...args) => {
                outputs.push({ type: 'info', content: args.join(' ') });
                // 不再调用 originalLog，避免重复显示
            };

            console.error = (...args) => {
                outputs.push({ type: 'error', content: args.join(' ') });
                // 不再调用 originalError，避免重复显示
            };

            return new Promise((resolve) => {
                Promise.resolve(fn()).then(() => {
                    console.log = originalLog;
                    console.error = originalError;
                    resolve(outputs);
                }).catch((error) => {
                    console.log = originalLog;
                    console.error = originalError;
                    outputs.push({ type: 'error', content: error.message });
                    resolve(outputs);
                });
            });
        }, []);

        // Gemini CLI 风格：终端尺寸检测和布局控制
        const terminalHeight = stdout.rows || 24;
        const terminalWidth = stdout.columns || 80;

        // Gemini CLI 风格：不使用定时器闪烁，依赖终端原生行为
        // 光标始终可见，使用 chalk.inverse() 创建稳定的光标效果
        const cursorVisible = true;

        // 可用命令
        const commands = [
            { command: '/init', description: 'Initialize migration environment' },
            { command: '/migrate', description: 'Run pending migrations' },
            { command: '/status', description: 'Show migration status' },
            { command: '/create', description: 'Create a new migration file' },
            { command: '/history', description: 'Show migration execution history' },
            { command: '/config', description: 'Show current configuration' },
            { command: '/config-init', description: 'Interactive configuration setup' },
            { command: '/config-set', description: 'Set configuration values' },
            { command: '/ping', description: 'Test database connection' },
            { command: '/about', description: 'Show version information' },
            { command: '/help', description: 'Show available commands' },
            { command: '/exit', description: 'Exit interactive mode' }
        ];

        // 添加对话
        const addConversation = useCallback((userInput, outputs) => {
            setConversations(prev => [...prev, { userInput, outputs, timestamp: Date.now() }]);
        }, []);

        // 对话框处理函数
        const handleInitDialogComplete = useCallback((result) => {
            setShowInitDialog(false);

            let finalOutputs = [];

            if (result.cancelled) {
                finalOutputs = [
                    { type: 'warning', content: '⚠️ Initialization cancelled' },
                    { type: 'info', content: 'Project initialization was cancelled by user.' }
                ];
            } else if (result.useCliMode) {
                finalOutputs = [
                    { type: 'info', content: '🔄 Switching to CLI mode for advanced configuration...' },
                    { type: 'success', content: 'Run: dbshift -p -- init' },
                    { type: 'info', content: 'This will provide full interactive experience with all prompts.' }
                ];
            } else {
                // 处理配置文件创建
                try {
                    const fs = require('fs');
                    const { dbConfig, configType } = result;

                    if (!dbConfig) {
                        finalOutputs = [{ type: 'error', content: '❌ No database configuration provided' }];
                    } else {
                        if (configType === 'env') {
                            const envContent = `MYSQL_HOST=${dbConfig.host}
MYSQL_PORT=${dbConfig.port}
MYSQL_USERNAME=${dbConfig.username}
MYSQL_PASSWORD=${dbConfig.password}
`;
                            fs.writeFileSync('.env', envContent);
                            finalOutputs = [
                                { type: 'success', content: '✅ Project initialized successfully!' },
                                { type: 'info', content: '📁 Created .env configuration file' },
                                { type: 'info', content: '📁 Created migrations/ directory' },
                                { type: 'info', content: 'Next steps: Create migrations with /create command' }
                            ];
                        } else {
                            const configContent = `module.exports = {
  development: {
    host: '${dbConfig.host}',
    port: ${dbConfig.port},
    user: '${dbConfig.username}',
    password: '${dbConfig.password}',
    database: 'your_database_name'
  },
  production: {
    host: process.env.MYSQL_HOST || '${dbConfig.host}',
    port: process.env.MYSQL_PORT || ${dbConfig.port},
    user: process.env.MYSQL_USERNAME || '${dbConfig.username}',
    password: process.env.MYSQL_PASSWORD || '${dbConfig.password}',
    database: process.env.MYSQL_DATABASE || 'your_database_name'
  }
};
`;
                            fs.writeFileSync('schema.config.js', configContent);
                            finalOutputs = [
                                { type: 'success', content: '✅ Project initialized successfully!' },
                                { type: 'info', content: '📁 Created schema.config.js configuration file' },
                                { type: 'info', content: '📁 Created migrations/ directory' },
                                { type: 'info', content: '💡 Edit schema.config.js to add your database name' },
                                { type: 'info', content: 'Next steps: Create migrations with /create command' }
                            ];
                        }

                        if (!fs.existsSync('migrations')) {
                            fs.mkdirSync('migrations');
                        }
                    }
                } catch (error) {
                    finalOutputs = [{ type: 'error', content: `❌ Error creating configuration: ${error.message}` }];
                }
            }

            // Update the last conversation instead of creating a new one
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: finalOutputs };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        const handleInitDialogCancel = useCallback(() => {
            setShowInitDialog(false);
            // Update the last conversation with the cancellation message
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: [{ type: 'info', content: '❌ Initialization cancelled' }] };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        // CreateDialog 处理函数
        const handleCreateDialogComplete = useCallback(async (result) => {
            setShowCreateDialog(false);
            setIsProcessing(false); // 立即重置处理状态

            let finalOutputs = [];
            if (result.cancelled) {
                finalOutputs = [{ type: 'warning', content: '⚠️ Migration creation cancelled' }];
            } else {
                try {
                    finalOutputs = await captureConsoleOutput(() => createCommand(result.name, { author: result.author, migrationType: result.type }));
                } catch (error) {
                    finalOutputs = [{ type: 'error', content: `❌ Error creating migration: ${error.message}` }];
                }
            }
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: finalOutputs };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [captureConsoleOutput, setConversations]);

        const handleCreateDialogCancel = useCallback(() => {
            setShowCreateDialog(false);
            setIsProcessing(false); // 立即重置处理状态
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: [{ type: 'info', content: '❌ Migration creation cancelled' }] };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        // ConfigDialog 处理函数
        const handleConfigDialogComplete = useCallback(async (result) => {
            setShowConfigDialog(false);
            setIsProcessing(false);

            let finalOutputs = [];
            if (result.cancelled) {
                finalOutputs = [{ type: 'warning', content: '⚠️ Configuration view cancelled' }];
            } else {
                try {
                    finalOutputs = await captureConsoleOutput(() => showConfigCommand({ env: result.environment }));
                } catch (error) {
                    finalOutputs = [{ type: 'error', content: `❌ Error loading configuration: ${error.message}` }];
                }
            }
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: finalOutputs };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [captureConsoleOutput, setConversations]);

        const handleConfigDialogCancel = useCallback(() => {
            setShowConfigDialog(false);
            setIsProcessing(false);
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: [{ type: 'info', content: '❌ Configuration view cancelled' }] };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        // ConfigInitDialog 处理函数
        const handleConfigInitDialogComplete = useCallback(async (result) => {
            // 🔑 立即设置状态，确保对话框隐藏
            setShowConfigInitDialog(false);
            setIsProcessing(false);

            let finalOutputs = [];
            if (result.cancelled) {
                finalOutputs = [{ type: 'warning', content: '⚠️ Configuration setup cancelled' }];
            } else {
                // 🔑 修复：直接在这里处理配置创建，避免调用 inquirer
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const { dbConfig, configType } = result;

                    finalOutputs.push({ type: 'info', content: `✓ Using ${configType === 'env' ? '.env' : 'schema.config.js'} format` });
                    finalOutputs.push({ type: 'info', content: `  Host: ${dbConfig.host}:${dbConfig.port}` });
                    finalOutputs.push({ type: 'info', content: `  User: ${dbConfig.username}` });
                    finalOutputs.push({ type: 'info', content: `  Password: ${dbConfig.password ? '***' : 'N/A'}` });

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
                        fs.writeFileSync('.env', envContent);
                        finalOutputs.push({ type: 'success', content: '✓ Created .env configuration file' });
                        finalOutputs.push({ type: 'info', content: '💡 For production, use environment variables to override .env values' });
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
                        fs.writeFileSync('schema.config.js', configContent);
                        finalOutputs.push({ type: 'success', content: '✓ Created schema.config.js configuration file' });
                        finalOutputs.push({ type: 'info', content: '💡 Use "dbshift migrate -e production" to run with production config' });
                        finalOutputs.push({ type: 'info', content: '💡 Set environment variables for production: MYSQL_HOST, MYSQL_USERNAME, etc.' });
                    }

                    finalOutputs.push({ type: 'success', content: '🎉 Database configuration initialized successfully!' });
                } catch (error) {
                    finalOutputs = [{ type: 'error', content: `❌ Error creating configuration: ${error.message}` }];
                }
            }
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: finalOutputs };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        const handleConfigInitDialogCancel = useCallback(() => {
            setShowConfigInitDialog(false);
            setIsProcessing(false);
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: [{ type: 'info', content: '❌ Configuration setup cancelled' }] };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        // ConfigSetDialog 处理函数
        const handleConfigSetDialogComplete = useCallback(async (result) => {
            setShowConfigSetDialog(false);
            setIsProcessing(false);

            let finalOutputs = [];
            if (result.cancelled) {
                finalOutputs = [{ type: 'warning', content: '⚠️ Configuration update cancelled' }];
            } else {
                // 🔑 修复：直接在这里处理配置更新，避免调用外部命令
                try {
                    const fs = require('fs');
                    const path = require('path');
                    
                    const targetEnv = result.environment || 'development';
                    finalOutputs.push({ type: 'info', content: `⚙️ Updating database configuration for [${targetEnv}] environment...` });
                    finalOutputs.push({ type: 'info', content: `  Environment: ${targetEnv}` });
                    finalOutputs.push({ type: 'info', content: `  Host: ${result.host}:${result.port}` });
                    finalOutputs.push({ type: 'info', content: `  User: ${result.username}` });
                    finalOutputs.push({ type: 'info', content: `  Password: ${result.password ? '***' : 'N/A'}` });

                    const envPath = path.join(process.cwd(), '.env');
                    const configPath = path.join(process.cwd(), 'schema.config.js');
                    
                    if (fs.existsSync(configPath)) {
                        // 更新 schema.config.js
                        let configContent = {};
                        try {
                            configContent = require(configPath);
                        } catch (error) {
                            configContent = {};
                        }

                        if (!configContent[targetEnv]) {
                            configContent[targetEnv] = {};
                        }

                        configContent[targetEnv].host = result.host;
                        configContent[targetEnv].port = parseInt(result.port);
                        configContent[targetEnv].user = result.username;
                        configContent[targetEnv].password = result.password;

                        // 生成配置文件内容，保留现有环境配置
                        const generateConfigContent = (config) => {
                            let content = 'module.exports = {\n';
                            
                            // 确保基本环境存在
                            const environments = ['development', 'staging', 'production'];
                            environments.forEach(env => {
                                if (config[env] || env === targetEnv) {
                                    const envConfig = config[env] || config[targetEnv];
                                    content += `  ${env}: {\n`;
                                    content += `    host: '${envConfig.host}',\n`;
                                    content += `    port: ${envConfig.port},\n`;
                                    content += `    user: '${envConfig.user}',\n`;
                                    if (env === 'production') {
                                        content += `    password: process.env.MYSQL_PASSWORD || '${envConfig.password}'\n`;
                                    } else {
                                        content += `    password: '${envConfig.password}'\n`;
                                    }
                                    content += `  }${env === 'production' ? '' : ','}\n`;
                                }
                            });
                            
                            content += '};\n';
                            return content;
                        };
                        
                        const configFileContent = generateConfigContent(configContent);
                        fs.writeFileSync(configPath, configFileContent);
                        finalOutputs.push({ type: 'success', content: `✓ Updated schema.config.js for [${targetEnv}] environment` });
                    } else if (fs.existsSync(envPath)) {
                        // 更新 .env 文件
                        const newEnvContent = `### MySQL Database Configuration
MYSQL_HOST=${result.host}
MYSQL_PORT=${result.port}
MYSQL_USERNAME=${result.username}
MYSQL_PASSWORD=${result.password}

# For production deployment, override these with environment variables:
# export MYSQL_HOST=your-prod-host
# export MYSQL_USERNAME=your-prod-user
# export MYSQL_PASSWORD=your-prod-password
`;
                        fs.writeFileSync(envPath, newEnvContent);
                        finalOutputs.push({ type: 'success', content: '✓ Updated .env configuration file' });
                    } else {
                        // 创建新的 .env 文件
                        const newEnvContent = `### MySQL Database Configuration
MYSQL_HOST=${result.host}
MYSQL_PORT=${result.port}
MYSQL_USERNAME=${result.username}
MYSQL_PASSWORD=${result.password}

# For production deployment, override these with environment variables:
# export MYSQL_HOST=your-prod-host
# export MYSQL_USERNAME=your-prod-user
# export MYSQL_PASSWORD=your-prod-password
`;
                        fs.writeFileSync(envPath, newEnvContent);
                        finalOutputs.push({ type: 'success', content: '✓ Created .env configuration file' });
                    }

                    finalOutputs.push({ type: 'success', content: '🎉 Database configuration updated successfully!' });
                } catch (error) {
                    finalOutputs = [{ type: 'error', content: `❌ Error updating configuration: ${error.message}` }];
                }
            }
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: finalOutputs };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [captureConsoleOutput, setConversations]);

        const handleConfigSetDialogCancel = useCallback(() => {
            setShowConfigSetDialog(false);
            setIsProcessing(false);
            setConversations(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updatedLast = { ...last, outputs: [{ type: 'info', content: '❌ Configuration update cancelled' }] };
                return [...prev.slice(0, -1), updatedLast];
            });
        }, [setConversations]);

        const updateSuggestions = useCallback((inputValue) => {
            if (inputValue.startsWith('/')) {
                // 斜杠命令模式 - 显示以输入开头的命令
                const filtered = commands.filter(cmd =>
                    cmd.command.toLowerCase().startsWith(inputValue.toLowerCase())
                );
                // 只有在真正变化时才更新状态
                setSuggestions(prev => {
                    if (prev.length !== filtered.length ||
                        prev.some((cmd, index) => cmd.command !== filtered[index]?.command)) {
                        return filtered;
                    }
                    return prev;
                });
                setSelectedSuggestion(0);
                setShowSuggestions(filtered.length > 0);
            } else if (inputValue.trim()) {
                // 普通模式，只显示完全匹配的命令
                const filtered = commands.filter(cmd =>
                    cmd.command.toLowerCase().startsWith(inputValue.toLowerCase())
                );
                setSuggestions(prev => {
                    if (prev.length !== filtered.length ||
                        prev.some((cmd, index) => cmd.command !== filtered[index]?.command)) {
                        return filtered;
                    }
                    return prev;
                });
                setSelectedSuggestion(0);
                setShowSuggestions(filtered.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, []);

        // 执行命令
        const executeCommand = useCallback(async (command) => {
            const parts = command.trim().split(' ');
            const cmdWithSlash = parts[0].toLowerCase();
            const cmd = cmdWithSlash.startsWith('/') ? cmdWithSlash.slice(1) : cmdWithSlash;
            const args = parts.slice(1);

            setIsProcessing(true);

            // 格式化用户输入显示（保留斜杠）
            const displayCommand = command.startsWith('/') ? command : `/${command}`;

            let outputs = [];

            try {
                switch (cmd) {
                    case 'init':
                        // 显示 Init 对话框 - 按照 Gemini CLI 方式，命令保留在历史中
                        setShowInitDialog(true);
                        setIsProcessing(false); // 重置处理状态，让对话框处理输入
                        outputs = [{ type: 'info', content: '🚀 Opening initialization dialog...' }];
                        // 对于对话框命令，先添加对话记录再返回，避免重复添加
                        addConversation(displayCommand, outputs);
                        return;

                    case 'migrate':
                        const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
                        outputs = await captureConsoleOutput(() => migrateCommand({ env }));
                        break;

                    case 'status':
                        const statusEnv = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
                        outputs = await captureConsoleOutput(() => statusCommand({ env: statusEnv }));
                        break;

                    case 'create':
                        // 显示 Create 对话框
                        setShowCreateDialog(true);
                        setIsProcessing(false); // 重置处理状态，让对话框处理输入
                        outputs = [{ type: 'info', content: '📝 Opening create migration dialog...' }];
                        // 对于对话框命令，先添加对话记录再返回，避免重复添加
                        addConversation(displayCommand, outputs);
                        return;

                    case 'history':
                        const historyEnv = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
                        const authorFilter = args.find(arg => arg.startsWith('--author='))?.split('=')[1];
                        outputs = await captureConsoleOutput(() => historyCommand({ env: historyEnv, author: authorFilter }));
                        break;

                    case 'config':
                        // 检查是否指定了环境参数
                        const configEnv = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
                        if (configEnv) {
                            // 如果指定了环境，直接显示
                            outputs = await captureConsoleOutput(() => showConfigCommand({ env: configEnv }));
                        } else {
                            // 如果没有指定环境，显示选择对话框
                            setShowConfigDialog(true);
                            setIsProcessing(false);
                            outputs = [{ type: 'info', content: '⚙️ Opening configuration view dialog...' }];
                            addConversation(displayCommand, outputs);
                            return;
                        }
                        break;

                    case 'config-init':
                        // 显示 ConfigInit 对话框
                        setShowConfigInitDialog(true);
                        setIsProcessing(false); // 重置处理状态，让对话框处理输入
                        outputs = [{ type: 'info', content: '⚙️ Opening configuration setup dialog...' }];
                        // 对于对话框命令，先添加对话记录再返回，避免重复添加
                        addConversation(displayCommand, outputs);
                        return;

                    case 'config-set':
                        // 检查是否有命令行参数
                        const hasCliArgs = args.some(arg => arg.startsWith('--host=') || arg.startsWith('--port=') || arg.startsWith('--user=') || arg.startsWith('--password=') || arg.startsWith('--database='));

                        if (hasCliArgs) {
                            // 如果有命令行参数，直接执行 configSetCommand
                            const configOptions = {
                                host: args.find(arg => arg.startsWith('--host='))?.split('=')[1],
                                port: args.find(arg => arg.startsWith('--port='))?.split('=')[1],
                                user: args.find(arg => arg.startsWith('--user='))?.split('=')[1],
                                password: args.find(arg => arg.startsWith('--password='))?.split('=')[1],
                                database: args.find(arg => arg.startsWith('--database='))?.split('=')[1],
                                env: args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development'
                            };
                            outputs = await captureConsoleOutput(() => configSetCommand(configOptions));
                        } else {
                            // 如果没有命令行参数，显示 ConfigSet 对话框
                            setShowConfigSetDialog(true);
                            setIsProcessing(false); // 重置处理状态，让对话框处理输入
                            outputs = [{ type: 'info', content: '⚙️ Opening configuration editor dialog...' }];
                            // 对于对话框命令，先添加对话记录再返回，避免重复添加
                            addConversation(displayCommand, outputs);
                            return;
                        }
                        break;

                    case 'ping':
                        const pingEnv = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
                        const pingOptions = {
                            env: pingEnv,
                            host: args.find(arg => arg.startsWith('--host='))?.split('=')[1],
                            port: args.find(arg => arg.startsWith('--port='))?.split('=')[1],
                            user: args.find(arg => arg.startsWith('--user='))?.split('=')[1],
                            password: args.find(arg => arg.startsWith('--password='))?.split('=')[1],
                            database: args.find(arg => arg.startsWith('--database='))?.split('=')[1]
                        };
                        outputs = await captureConsoleOutput(() => testConnectionCommand(pingOptions));
                        break;

                    case 'about':
                        outputs = [
                            { type: 'info', content: 'About DBShift CLI' },
                            { type: 'info', content: '' },
                            { type: 'info', content: 'CLI Version      ' + package.version },
                            { type: 'info', content: 'Database         MySQL' },
                            { type: 'info', content: 'Framework        Node.js' },
                            { type: 'info', content: 'Migration Tool   Flyway-inspired' },
                            { type: 'info', content: 'License          MIT' },
                            { type: 'info', content: 'Author           greddy7574' }
                        ];
                        break;

                    case 'help':
                        outputs = [
                            { type: 'info', content: '📋 Available Commands:' },
                            ...commands.map(cmd => ({
                                type: 'info',
                                content: `  ${cmd.command.padEnd(15)} ${cmd.description}`
                            }))
                        ];
                        break;

                    case 'exit':
                        outputs = [{ type: 'info', content: '👋 Goodbye!' }];
                        addConversation(displayCommand, outputs);
                        exit();
                        return;

                    default:
                        outputs = [{ type: 'error', content: `❌ Unknown command: ${cmd}. Type 'help' for available commands.` }];
                        break;
                }
            } catch (error) {
                outputs = [{ type: 'error', content: `❌ Error executing command: ${error.message}` }];
            } finally {
                setIsProcessing(false);
            }

            // 添加对话记录
            addConversation(displayCommand, outputs);
        }, [addConversation, exit, captureConsoleOutput]);

        // 处理命令提交
        const handleSubmit = useCallback(async (command) => {
            if (!command.trim() || isProcessing) return;

            // 添加到历史记录（会话内累积，允许重复）
            setHistory(prev => {
                const updatedHistory = [...prev, command.trim()]; // 直接添加到末尾，保持完整顺序
                
                // 异步保存历史记录
                setTimeout(() => saveHistory(updatedHistory), 0);
                
                return updatedHistory.slice(-MAX_HISTORY_SIZE); // 限制历史记录大小
            });
            setHistoryIndex(-1);

            // 清空输入和建议
            setInput('');
            setSuggestions([]);
            setShowSuggestions(false);

            // 执行命令
            await executeCommand(command);
        }, [executeCommand, isProcessing, addConversation]);

        // 删除字符的稳定回调 - 分离状态更新，确保光标位置正确
        const handleDelete = useCallback(() => {
            setInput(prevInput => {
                if (prevInput.length === 0) return prevInput;
                
                // 重置其他状态
                setHistoryIndex(-1);
                setShowSuggestions(false);
                setSuggestions([]);
                
                // 删除最后一个字符（退格键行为）
                return prevInput.slice(0, -1);
            });
            
            // 分离光标位置更新
            setCursorPosition(prevCursorPos => {
                if (input.length === 0) return 0;
                const validCursorPos = Math.max(0, Math.min(prevCursorPos, input.length));
                return Math.max(0, validCursorPos - 1);
            });
        }, [input.length]);

        // 键盘事件处理 - 只在没有对话框时监听
        useInput(useCallback((inputChar, key) => {
            // 如果对话框显示，完全不处理输入，让对话框处理
            if (showInitDialog || showCreateDialog || showConfigDialog || showConfigInitDialog || showConfigSetDialog) {
                return;
            }

            if (isProcessing) {
                return;
            }

            if (key.upArrow) {
                // 🔑 修复：优先使用历史记录导航，除非明确在建议模式下
                if (history.length > 0 && (!showSuggestions || suggestions.length === 0)) {
                    // 历史导航向上 - 改进的历史记录导航
                    let newIndex;
                    if (historyIndex === -1) {
                        // 从最新的历史记录开始
                        newIndex = history.length - 1;
                    } else {
                        // 向前查看更早的历史记录
                        newIndex = Math.max(0, historyIndex - 1);
                    }
                    setHistoryIndex(newIndex);
                    const selectedCommand = history[newIndex];
                    setInput(selectedCommand);
                    setCursorPosition(selectedCommand.length); // 移动光标到末尾
                    // 清除建议以避免干扰
                    setSuggestions([]);
                    setShowSuggestions(false);
                } else if (showSuggestions && suggestions.length > 0) {
                    // 在建议列表中向上导航
                    setSelectedSuggestion(prev => {
                        const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
                        // 调整滚动偏移量
                        if (newIndex < scrollOffset) {
                            setScrollOffset(newIndex);
                        } else if (newIndex >= scrollOffset + VISIBLE_SUGGESTIONS_COUNT) {
                            setScrollOffset(newIndex - VISIBLE_SUGGESTIONS_COUNT + 1);
                        }
                        return newIndex;
                    });
                }
            } else if (key.downArrow) {
                // 🔑 修复：优先使用历史记录导航，除非明确在建议模式下
                if (historyIndex !== -1 && history.length > 0 && (!showSuggestions || suggestions.length === 0)) {
                    // 历史导航向下 - 改进的历史记录导航
                    const newIndex = historyIndex + 1;
                    if (newIndex < history.length) {
                        // 还有更新的历史记录
                        setHistoryIndex(newIndex);
                        const selectedCommand = history[newIndex];
                        setInput(selectedCommand);
                        setCursorPosition(selectedCommand.length); // 移动光标到末尾
                        // 清除建议以避免干扰
                        setSuggestions([]);
                        setShowSuggestions(false);
                    } else {
                        // 到达最新，回到空输入
                        setHistoryIndex(-1);
                        setInput('');
                        setCursorPosition(0); // 移动光标到开头
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                } else if (showSuggestions && suggestions.length > 0) {
                    // 在建议列表中向下导航
                    setSelectedSuggestion(prev => {
                        const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
                        // 调整滚动偏移量
                        if (newIndex >= scrollOffset + VISIBLE_SUGGESTIONS_COUNT) {
                            setScrollOffset(newIndex - VISIBLE_SUGGESTIONS_COUNT + 1);
                        } else if (newIndex < scrollOffset) {
                            setScrollOffset(newIndex);
                        }
                        return newIndex;
                    });
                }
            } else if (key.leftArrow) {
                // 左方向键
                setCursorPosition(prev => Math.max(0, prev - 1));
            } else if (key.rightArrow) {
                // 右方向键
                setCursorPosition(prev => Math.min(input.length, prev + 1));
            } else if (key.tab) {
                // Tab 自动补全
                if (suggestions.length > 0) {
                    const selectedCommand = suggestions[selectedSuggestion].command;
                    setInput(selectedCommand);
                    setCursorPosition(selectedCommand.length); // 移动光标到末尾
                    updateSuggestions(selectedCommand);
                    // 重置历史导航
                    setHistoryIndex(-1);
                }
            } else if (key.return) {
                // 提交命令
                let commandToExecute = input;
                if (showSuggestions && suggestions.length > 0) {
                    // 如果有建议，选择当前建议并执行
                    commandToExecute = suggestions[selectedSuggestion].command;
                    setInput(commandToExecute);
                    setCursorPosition(commandToExecute.length); // 移动光标到末尾
                    setShowSuggestions(false);
                    setSuggestions([]);
                }
                // 重置历史导航
                setHistoryIndex(-1);
                // 提交命令
                handleSubmit(commandToExecute);
            } else if (key.escape) {
                // 隐藏建议，允许历史导航
                setShowSuggestions(false);
                setSuggestions([]);
                // 🔑 修复：按Escape键时不重置历史导航状态
                // setHistoryIndex(-1); // 移除这行，让用户可以在关闭建议后继续历史导航
            } else if (key.ctrl && inputChar === 'c') {
                // Ctrl+C 退出
                addConversation('/exit', [{ type: 'info', content: '👋 Goodbye!' }]);
                exit();
            } else if (key.backspace || key.delete || inputChar === '\u0008' || inputChar === '\u007f') {
                // 删除字符 - 支持多种删除键变体，使用稳定的回调
                handleDelete();
            } else if (inputChar && inputChar.length === 1 && !key.ctrl && !key.meta && !key.tab && !key.return && !key.backspace && !key.delete && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow && !key.escape && inputChar !== '\u0008' && inputChar !== '\u007f') {
                // 普通字符输入 - 插入到光标位置
                const charCode = inputChar.charCodeAt(0);
                if (charCode >= 32 && charCode <= 126) {
                    // 🔑 修复光标位置：简化逻辑，分离状态更新
                    setInput(prevInput => {
                        // 计算有效的插入位置（通常在末尾）
                        const insertPos = Math.max(0, Math.min(cursorPosition, prevInput.length));
                        
                        // 重置其他状态
                        setHistoryIndex(-1);
                        setShowSuggestions(false);
                        setSuggestions([]);
                        
                        // 插入字符到当前光标位置
                        return prevInput.slice(0, insertPos) + inputChar + prevInput.slice(insertPos);
                    });
                    
                    // 分离光标位置更新，确保与输入同步
                    setCursorPosition(prevCursorPos => {
                        const validPos = Math.max(0, Math.min(prevCursorPos, input.length));
                        return validPos + 1;
                    });
                }
            }
        }, [input, history, historyIndex, suggestions, selectedSuggestion, showSuggestions, handleSubmit, isProcessing, exit, addConversation, updateSuggestions, showInitDialog, showCreateDialog, showConfigDialog, showConfigInitDialog, showConfigSetDialog, cursorPosition, handleDelete]));

        // 监听输入变化 - 优化防抖策略，提升快速输入时的响应性
        useEffect(() => {
            const timeoutId = setTimeout(() => {
                updateSuggestions(input);
            }, input.length === 0 ? 30 : 80); // 进一步减少延迟，提升响应性

            return () => clearTimeout(timeoutId);
        }, [input, updateSuggestions]);

        // 渲染界面 - 完全按照 Gemini CLI 的真实结构复制
        return React.createElement(Box, {
                flexDirection: 'column',
                marginBottom: 1,
                width: '90%'
            },
            // Static 区域 - 对应 Gemini CLI 的固定内容
            React.createElement(Static, {
                key: 'staticContent',
                items: [
                    React.createElement(Box, { key: 'header', flexDirection: 'column' },
                        React.createElement(DBShiftLogo),
                        React.createElement(WelcomeTips)
                    )
                ]
            }, (item) => item),

            // OverflowProvider 区域 - 对应 Gemini CLI 的滚动内容
            React.createElement(Box, { flexDirection: 'column' },
                conversations.map((conversation, index) =>
                    React.createElement(Box, { key: index, flexDirection: 'column', marginBottom: 1 },
                        React.createElement(UserInputBox, { command: conversation.userInput }),
                        React.createElement(CommandOutputBox, { outputs: conversation.outputs })
                    )
                )
            ),

            // 主控制区域 - 完全对应 Gemini CLI 的 mainControlsRef
            React.createElement(Box, { flexDirection: 'column' },
                // 条件渲染 - 完全按照 Gemini CLI 的三元运算符结构
                showInitDialog ? (
                    React.createElement(Box, { flexDirection: 'column' },
                        React.createElement(InitDialog, {
                            isVisible: showInitDialog,
                            onComplete: handleInitDialogComplete,
                            onCancel: handleInitDialogCancel
                        })
                    )
                ) : showCreateDialog ? (
                    React.createElement(Box, { flexDirection: 'column' },
                        React.createElement(CreateDialog, {
                            isVisible: showCreateDialog,
                            onComplete: handleCreateDialogComplete,
                            onCancel: handleCreateDialogCancel
                        })
                    )
                ) : showConfigDialog ? (
                    React.createElement(Box, { flexDirection: 'column' },
                        React.createElement(ConfigDialog, {
                            isVisible: showConfigDialog,
                            onComplete: handleConfigDialogComplete,
                            onCancel: handleConfigDialogCancel
                        })
                    )
                ) : showConfigInitDialog ? (
                    React.createElement(Box, { flexDirection: 'column' },
                        React.createElement(ConfigInitDialog, {
                            isVisible: showConfigInitDialog,
                            onComplete: handleConfigInitDialogComplete,
                            onCancel: handleConfigInitDialogCancel
                        })
                    )
                ) : showConfigSetDialog ? (
                    React.createElement(Box, { flexDirection: 'column' },
                        React.createElement(ConfigSetDialog, {
                            isVisible: showConfigSetDialog,
                            onComplete: handleConfigSetDialogComplete,
                            onCancel: handleConfigSetDialogCancel,
                            initialConfig: {}
                        })
                    )
                ) : (
                    React.createElement(React.Fragment, {},
                        React.createElement(InputBox, {
                            value: input,
                            showCursor: cursorVisible,
                            cursorPosition: cursorPosition
                        }),

                        showSuggestions && React.createElement(CommandSuggestions, {
                            commands: suggestions,
                            selectedIndex: selectedSuggestion,
                            showCount: true,
                            scrollOffset: scrollOffset,
                            visibleCount: VISIBLE_SUGGESTIONS_COUNT
                        })
                    )
                )
            )
        );
    };

    // 渲染应用
    render(React.createElement(DBShiftApp));
}

module.exports = { startInteractiveMode };
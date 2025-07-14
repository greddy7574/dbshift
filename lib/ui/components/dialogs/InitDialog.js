const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useCallback, useEffect } = React;
const fs = require('fs');
const path = require('path');

// InitDialog 组件 - 模仿 Gemini CLI 的 AuthDialog
const InitDialog = ({ isVisible, onComplete, onCancel }) => {
    const [step, setStep] = useState('checking'); // checking, confirm, format, connection, custom
    const [selectedOption, setSelectedOption] = useState(0);
    const [configType, setConfigType] = useState('env');
    const [customConfig, setCustomConfig] = useState({
        host: 'localhost',
        port: '3306',
        username: 'root',
        password: ''
    });
    const [inputField, setInputField] = useState('host'); // host, port, username, password
    const [hasExistingConfig, setHasExistingConfig] = useState(false);
    const [existingFiles, setExistingFiles] = useState([]);

    // 检查是否存在配置文件
    useEffect(() => {
        if (isVisible && step === 'checking') {
            const envPath = path.join(process.cwd(), '.env');
            const configPath = path.join(process.cwd(), 'schema.config.js');
            
            const envExists = fs.existsSync(envPath);
            const configExists = fs.existsSync(configPath);
            
            const files = [];
            if (envExists) files.push('.env');
            if (configExists) files.push('schema.config.js');
            
            setExistingFiles(files);
            setHasExistingConfig(envExists || configExists);
            
            // 如果没有配置文件，直接跳到格式选择步骤
            if (!envExists && !configExists) {
                setStep('format');
            } else {
                setStep('confirm');
            }
        }
    }, [isVisible, step]);

    const handleKeyInput = useCallback((input, key) => {

        const maxOptions = (() => {
            switch(step) {
                case 'checking': return 0; // 无选项，只是检查状态
                case 'confirm': return 2; // Yes, No
                case 'format': return 2;  // .env, schema.config.js
                case 'connection': return 2; // Default, Custom
                case 'custom': return 4; // host, port, username, password
                default: return 2;
            }
        })();

        if (key.upArrow) {
            if (step === 'custom') {
                // 在自定义配置步骤，上下键用于字段导航
                const fields = ['host', 'port', 'username', 'password'];
                const currentIndex = fields.indexOf(inputField);
                const newIndex = currentIndex > 0 ? currentIndex - 1 : fields.length - 1;
                setInputField(fields[newIndex]);
                setSelectedOption(newIndex);
            } else {
                setSelectedOption(prev => prev > 0 ? prev - 1 : maxOptions - 1);
            }
        } else if (key.downArrow) {
            if (step === 'custom') {
                // 在自定义配置步骤，上下键用于字段导航
                const fields = ['host', 'port', 'username', 'password'];
                const currentIndex = fields.indexOf(inputField);
                const newIndex = currentIndex < fields.length - 1 ? currentIndex + 1 : 0;
                setInputField(fields[newIndex]);
                setSelectedOption(newIndex);
            } else {
                setSelectedOption(prev => prev < maxOptions - 1 ? prev + 1 : 0);
            }
        } else if (key.return) {
            // 处理选择逻辑
            switch(step) {
                case 'confirm':
                    if (selectedOption === 0) { // Yes
                        setStep('format');
                        setSelectedOption(0);
                    } else { // No
                        onComplete({ cancelled: true });
                    }
                    break;
                case 'format':
                    const type = selectedOption === 0 ? 'env' : 'js';
                    setConfigType(type);
                    setStep('connection');
                    setSelectedOption(0);
                    break;
                case 'connection':
                    if (selectedOption === 0) { // Use defaults
                        onComplete({
                            configType: configType, // 使用用户选择的配置类型
                            useDefaults: true,
                            dbConfig: {
                                host: 'localhost',
                                port: '3306',
                                username: 'root',
                                password: ''
                            }
                        });
                    } else { // Custom connection
                        setStep('custom');
                        setSelectedOption(0);
                        setInputField('host');
                    }
                    break;
                case 'custom':
                    // 在自定义配置步骤，Enter 键完成配置
                    onComplete({
                        configType: configType, // 使用用户选择的配置类型
                        useDefaults: false,
                        dbConfig: customConfig
                    });
                    break;
            }
        } else if (key.escape) {
            onCancel();
        } else if (step === 'custom' && input && input.length === 1 && !key.ctrl && !key.meta && input !== '\u0008' && input !== '\u007f') {
            // 处理自定义配置的字符输入 (过滤退格键字符)
            const charCode = input.charCodeAt(0);
            if (charCode >= 32 && charCode <= 126) { // 只允许可打印字符
                setCustomConfig(prev => ({
                    ...prev,
                    [inputField]: prev[inputField] + input
                }));
            }
        } else if (step === 'custom' && (key.backspace || key.delete || input === '\u0008' || input === '\u007f')) {
            // 处理退格键和删除键 (支持多种退格键变体)
            setCustomConfig(prev => ({
                ...prev,
                [inputField]: prev[inputField].slice(0, -1)
            }));
        } else if (step === 'custom' && key.ctrl && (input === 'u' || input === 'a')) {
            // Ctrl+U 或 Ctrl+A 清空当前字段
            setCustomConfig(prev => ({
                ...prev,
                [inputField]: ''
            }));
        }
    }, [isVisible, step, selectedOption, onComplete, onCancel, setConfigType, inputField, customConfig]);

    // 在渲染阶段检查可见性
    if (!isVisible) return null;

    // 🔑 修复：只有在可见且不在检查状态时才注册键盘监听，避免与主组件输入冲突
    useInput((input, key) => {
        if (step !== 'checking') {
            handleKeyInput(input, key);
        }
    });

    // Gemini CLI 风格：底部显示的对话框，不覆盖整个界面
    return React.createElement(Box, {
            borderStyle: 'single',
            borderColor: 'cyan',
            paddingX: 2,
            paddingY: 1,
            marginTop: 1,
            backgroundColor: 'black'
        },
        React.createElement(Box, { flexDirection: 'column' },
            // 标题
            React.createElement(Text, {
                color: 'cyan',
                bold: true,
                marginBottom: 1
            }, '🚀 Initialize DBShift Project'),

            // 步骤内容
            step === 'checking' && React.createElement(Box, { flexDirection: 'column' },
                React.createElement(Text, {
                    color: 'blue',
                    marginBottom: 1
                }, '🔍 Checking for existing configuration...')),

            step === 'confirm' && React.createElement(Box, { flexDirection: 'column' },
                React.createElement(Text, {
                    color: 'yellow',
                    marginBottom: 1
                }, `⚠️ Found existing configuration files: ${existingFiles.join(', ')}. Overwrite?`),

                React.createElement(Text, {
                    color: selectedOption === 0 ? 'black' : 'white',
                    backgroundColor: selectedOption === 0 ? 'cyan' : undefined,
                    marginBottom: 0
                }, `${selectedOption === 0 ? '▶ ' : '  '}Yes, overwrite existing configuration`),

                React.createElement(Text, {
                    color: selectedOption === 1 ? 'black' : 'white',
                    backgroundColor: selectedOption === 1 ? 'cyan' : undefined
                }, `${selectedOption === 1 ? '▶ ' : '  '}No, cancel initialization`)),

            step === 'format' && React.createElement(Box, { flexDirection: 'column' },
                React.createElement(Text, {
                    color: 'green',
                    marginBottom: 1
                }, '📋 Choose configuration format:'),

                React.createElement(Text, {
                    color: selectedOption === 0 ? 'black' : 'white',
                    backgroundColor: selectedOption === 0 ? 'cyan' : undefined,
                    marginBottom: 0
                }, `${selectedOption === 0 ? '▶ ' : '  '}.env file (Simple) - Recommended`),

                React.createElement(Text, {
                    color: selectedOption === 1 ? 'black' : 'white',
                    backgroundColor: selectedOption === 1 ? 'cyan' : undefined
                }, `${selectedOption === 1 ? '▶ ' : '  '}schema.config.js (Advanced) - Multiple environments`)),

            step === 'connection' && React.createElement(Box, { flexDirection: 'column' },
                React.createElement(Text, {
                    color: 'blue',
                    marginBottom: 1
                }, '🔧 Database connection settings:'),

                React.createElement(Text, {
                    color: selectedOption === 0 ? 'black' : 'white',
                    backgroundColor: selectedOption === 0 ? 'cyan' : undefined,
                    marginBottom: 0
                }, `${selectedOption === 0 ? '▶ ' : '  '}Use defaults (localhost:3306, root, no password)`),

                React.createElement(Text, {
                    color: selectedOption === 1 ? 'black' : 'white',
                    backgroundColor: selectedOption === 1 ? 'cyan' : undefined
                }, `${selectedOption === 1 ? '▶ ' : '  '}Custom connection`)),

            step === 'custom' && React.createElement(Box, { flexDirection: 'column' },
                React.createElement(Text, {
                    color: 'blue',
                    marginBottom: 1
                }, '🔧 Enter database connection details:'),

                // Host field
                React.createElement(Text, {
                    color: inputField === 'host' ? 'black' : 'white',
                    backgroundColor: inputField === 'host' ? 'cyan' : undefined,
                    marginBottom: 0
                }, `Host: ${customConfig.host}${inputField === 'host' ? '|' : ''}`),

                // Port field
                React.createElement(Text, {
                    color: inputField === 'port' ? 'black' : 'white',
                    backgroundColor: inputField === 'port' ? 'cyan' : undefined,
                    marginBottom: 0
                }, `Port: ${customConfig.port}${inputField === 'port' ? '|' : ''}`),

                // Username field
                React.createElement(Text, {
                    color: inputField === 'username' ? 'black' : 'white',
                    backgroundColor: inputField === 'username' ? 'cyan' : undefined,
                    marginBottom: 0
                }, `Username: ${customConfig.username}${inputField === 'username' ? '|' : ''}`),

                // Password field
                React.createElement(Text, {
                    color: inputField === 'password' ? 'black' : 'white',
                    backgroundColor: inputField === 'password' ? 'cyan' : undefined
                }, `Password: ${'*'.repeat(Math.max(0, Math.min(customConfig.password.length, 50)))}${inputField === 'password' ? '|' : ''}`)),

            // 提示信息
            React.createElement(Text, {
                color: 'gray',
                marginTop: 1
            }, step === 'custom'
                ? 'Type to edit, ↑↓ to navigate fields, Backspace to delete, Ctrl+U to clear, Enter to finish, Esc to cancel'
                : 'Use ↑↓ arrows to select, Enter to confirm, Esc to cancel'))
    );
};

module.exports = InitDialog;
const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useCallback } = React;

// ConfigInitDialog 组件 - 用于 /config-init 命令的交互式配置向导
const ConfigInitDialog = ({ isVisible, onComplete, onCancel }) => {
    const [step, setStep] = useState('format'); // format, connection, custom
    const [selectedOption, setSelectedOption] = useState(0);
    const [configType, setConfigType] = useState('env');
    const [customConfig, setCustomConfig] = useState({
        host: 'localhost',
        port: '3306',
        username: 'root',  // 🔑 修复：统一使用 username 字段
        password: ''
    });
    const [inputField, setInputField] = useState('host'); // host, port, user, password

    const handleKeyInput = useCallback((input, key) => {

        const maxOptions = (() => {
            switch(step) {
                case 'format': return 2;  // .env, schema.config.js
                case 'connection': return 2; // Default, Custom
                case 'custom': return 4; // host, port, user, password
                default: return 2;
            }
        })();

        if (key.upArrow) {
            if (step === 'custom') {
                // 在自定义配置步骤，上下键用于字段导航
                const fields = ['host', 'port', 'username', 'password'];  // 🔑 修复：统一使用 username
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
                const fields = ['host', 'port', 'username', 'password'];  // 🔑 修复：统一使用 username
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
                case 'format':
                    const type = selectedOption === 0 ? 'env' : 'js';
                    setConfigType(type);
                    setStep('connection');
                    setSelectedOption(0);
                    break;
                case 'connection':
                    if (selectedOption === 0) { // Use defaults
                        onComplete({
                            configType: configType,
                            useDefaults: true,
                            dbConfig: {
                                host: 'localhost',
                                port: '3306',
                                username: 'root',  // 🔑 修复：统一使用 username 字段
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
                        configType: configType,
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
    }, [isVisible, step, selectedOption, onComplete, onCancel, configType, inputField, customConfig]);

    // 在渲染阶段检查可见性
    if (!isVisible) return null;

    // 🔑 修复：只有在可见时才注册键盘监听，避免与主组件输入冲突
    useInput(handleKeyInput);

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
            }, '⚙️ Configuration Setup'),

            // 步骤内容
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
                }, `${selectedOption === 1 ? '▶ ' : '  '}schema.config.js (Advanced) - Multiple environments`)
            ),

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
                }, `${selectedOption === 1 ? '▶ ' : '  '}Custom connection`)
            ),

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

                // User field
                React.createElement(Text, {
                    color: inputField === 'username' ? 'black' : 'white',  // 🔑 修复：使用 username
                    backgroundColor: inputField === 'username' ? 'cyan' : undefined,  // 🔑 修复：使用 username
                    marginBottom: 0
                }, `User: ${customConfig.username}${inputField === 'username' ? '|' : ''}`),  // 🔑 修复：使用 username 字段

                // Password field
                React.createElement(Text, {
                    color: inputField === 'password' ? 'black' : 'white',
                    backgroundColor: inputField === 'password' ? 'cyan' : undefined
                }, `Password: ${'*'.repeat(Math.max(0, Math.min(customConfig.password.length, 50)))}${inputField === 'password' ? '|' : ''}`)
            ),

            // 提示信息
            React.createElement(Text, {
                color: 'gray',
                marginTop: 1
            }, step === 'custom'
                ? 'Type to edit, ↑↓ to navigate fields, Backspace to delete, Ctrl+U to clear, Enter to finish, Esc to cancel'
                : 'Use ↑↓ arrows to select, Enter to confirm, Esc to cancel')
        )
    );
};

module.exports = ConfigInitDialog;
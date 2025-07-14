const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useCallback, useEffect } = React;

// ConfigSetDialog 组件 - 用于 /config-set 命令的交互式配置向导
const ConfigSetDialog = ({ isVisible, onComplete, onCancel, initialConfig = {} }) => {
    const [inputField, setInputField] = useState('environment'); // environment, host, port, username, password
    const [currentConfig, setCurrentConfig] = useState({
        environment: initialConfig.environment || 'development',
        host: initialConfig.host || 'localhost',
        port: initialConfig.port || '3306',
        username: initialConfig.username || 'root',
        password: initialConfig.password || ''
    });

    // 确保在 initialConfig 变化时更新 currentConfig
    useEffect(() => {
        setCurrentConfig({
            environment: initialConfig.environment || 'development',
            host: initialConfig.host || 'localhost',
            port: initialConfig.port || '3306',
            username: initialConfig.username || 'root',
            password: initialConfig.password || ''
        });
    }, [initialConfig]);

    const handleKeyInput = useCallback((input, key) => {
        if (!isVisible) return;

        const fields = ['environment', 'host', 'port', 'username', 'password'];
        const currentIndex = fields.indexOf(inputField);

        if (key.upArrow) {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : fields.length - 1;
            setInputField(fields[newIndex]);
        } else if (key.downArrow) {
            const newIndex = currentIndex < fields.length - 1 ? currentIndex + 1 : 0;
            setInputField(fields[newIndex]);
        } else if (key.return) {
            // 映射字段名称以匹配处理函数期望的格式
            onComplete({
                environment: currentConfig.environment,
                host: currentConfig.host,
                port: currentConfig.port,
                username: currentConfig.username,  // 映射到 username
                password: currentConfig.password,
                cancelled: false
            });
        } else if (key.escape) {
            onComplete({ cancelled: true });
        } else if (inputField === 'environment' && (key.leftArrow || key.rightArrow || input === ' ')) {
            // 环境字段特殊处理：左右箭头或空格键切换环境
            const environments = ['development', 'staging', 'production'];
            const currentIndex = environments.indexOf(currentConfig.environment);
            let newIndex;
            
            if (key.leftArrow) {
                newIndex = currentIndex > 0 ? currentIndex - 1 : environments.length - 1;
            } else {
                newIndex = currentIndex < environments.length - 1 ? currentIndex + 1 : 0;
            }
            
            setCurrentConfig(prev => ({
                ...prev,
                environment: environments[newIndex]
            }));
        } else if (inputField !== 'environment' && input && input.length === 1 && !key.ctrl && !key.meta && input !== '\u0008' && input !== '\u007f') {
            // 处理字符输入 (过滤退格键字符)
            const charCode = input.charCodeAt(0);
            if (charCode >= 32 && charCode <= 126) { // 只允许可打印字符
                setCurrentConfig(prev => ({
                    ...prev,
                    [inputField]: prev[inputField] + input
                }));
            }
        } else if (key.backspace || key.delete || input === '\u0008' || input === '\u007f') {
            // 处理退格键和删除键 (支持多种退格键变体)
            setCurrentConfig(prev => ({
                ...prev,
                [inputField]: prev[inputField].slice(0, -1)
            }));
        } else if (key.ctrl && (input === 'u' || input === 'a')) {
            // Ctrl+U 或 Ctrl+A 清空当前字段
            setCurrentConfig(prev => ({
                ...prev,
                [inputField]: ''
            }));
        }
    }, [isVisible, inputField, currentConfig, onComplete, onCancel]);

    useInput(handleKeyInput);

    if (!isVisible) return null;

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
            }, '⚙️ Set Database Configuration'),

            React.createElement(Text, {
                color: 'blue',
                marginBottom: 1
            }, '🔧 Edit database connection details:'),

            // Environment field
            React.createElement(Text, {
                color: inputField === 'environment' ? 'black' : 'white',
                backgroundColor: inputField === 'environment' ? 'cyan' : undefined,
                marginBottom: 0
            }, `Environment: ${currentConfig.environment}${inputField === 'environment' ? ' (←→ or Space to change)' : ''}`),

            // Host field
            React.createElement(Text, {
                color: inputField === 'host' ? 'black' : 'white',
                backgroundColor: inputField === 'host' ? 'cyan' : undefined,
                marginBottom: 0
            }, `Host: ${currentConfig.host}${inputField === 'host' ? '|' : ''}`),

            // Port field
            React.createElement(Text, {
                color: inputField === 'port' ? 'black' : 'white',
                backgroundColor: inputField === 'port' ? 'cyan' : undefined,
                marginBottom: 0
            }, `Port: ${currentConfig.port}${inputField === 'port' ? '|' : ''}`),

            // User field
            React.createElement(Text, {
                color: inputField === 'username' ? 'black' : 'white',
                backgroundColor: inputField === 'username' ? 'cyan' : undefined,
                marginBottom: 0
            }, `User: ${currentConfig.username}${inputField === 'username' ? '|' : ''}`),

            // Password field
            React.createElement(Text, {
                color: inputField === 'password' ? 'black' : 'white',
                backgroundColor: inputField === 'password' ? 'cyan' : undefined
            }, `Password: ${'*'.repeat(Math.max(0, Math.min(currentConfig.password.length, 50)))}${inputField === 'password' ? '|' : ''}`),

            // 提示信息
            React.createElement(Text, {
                color: 'gray',
                marginTop: 1
            }, 'Type to edit, ↑↓ to navigate fields, Backspace to delete, Ctrl+U to clear, Enter to finish, Esc to cancel')
        )
    );
};

module.exports = ConfigSetDialog;

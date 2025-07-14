const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useCallback } = React;

// ConfigDialog 组件 - 用于 /config 命令的环境选择对话框
const ConfigDialog = ({ isVisible, onComplete, onCancel }) => {
    const [selectedEnvironment, setSelectedEnvironment] = useState(0);
    const environments = ['development', 'production'];

    const handleKeyInput = useCallback((inputChar, key) => {
        if (!isVisible) return false;

        if (key.upArrow) {
            setSelectedEnvironment(prev => prev > 0 ? prev - 1 : environments.length - 1);
        } else if (key.downArrow) {
            setSelectedEnvironment(prev => prev < environments.length - 1 ? prev + 1 : 0);
        } else if (key.return) {
            onComplete({ environment: environments[selectedEnvironment] });
        } else if (key.escape) {
            onCancel();
        }
    }, [isVisible, selectedEnvironment, onComplete, onCancel, environments]);

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
            React.createElement(Text, {
                color: 'cyan',
                bold: true,
                marginBottom: 1
            }, '⚙️ View Configuration'),

            React.createElement(Text, {
                color: 'white',
                marginBottom: 1
            }, 'Select environment to view:'),

            environments.map((env, index) =>
                React.createElement(Text, {
                    key: env,
                    color: selectedEnvironment === index ? 'black' : 'white',
                    backgroundColor: selectedEnvironment === index ? 'cyan' : undefined,
                    marginBottom: 0
                }, `${selectedEnvironment === index ? '▶ ' : '  '}${env}`)
            ),

            React.createElement(Text, {
                color: 'gray',
                marginTop: 1
            }, 'Use ↑↓ arrows to select, Enter to confirm, Esc to cancel')
        )
    );
};

module.exports = ConfigDialog;
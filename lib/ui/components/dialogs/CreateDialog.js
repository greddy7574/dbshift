const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useCallback } = React;

// CreateDialog 组件 - 用于 /create 命令的交互式对话框（简化版）
const CreateDialog = ({ isVisible, onComplete, onCancel }) => {
    const [inputField, setInputField] = useState('name'); // name, author
    const [migrationName, setMigrationName] = useState('');
    const [authorName, setAuthorName] = useState('Admin');

    const handleKeyInput = useCallback((inputChar, key) => {
        if (!isVisible) return false; // Only process keyboard events when visible, return false to allow event propagation

        if (key.upArrow || key.downArrow) {
            // 上下箭头键切换字段
            if (inputField === 'name') {
                setInputField('author');
            } else {
                setInputField('name');
            }
        } else if (key.return) {
            // Enter 键提交
            if (migrationName.trim() === '') {
                // 迁移名称不能为空
                return;
            }
            onComplete({ 
                name: migrationName, 
                author: authorName || 'Admin', 
                type: 'custom' // 固定使用 custom 类型
            });
        } else if (key.escape) {
            onCancel();
        } else if (inputChar && inputChar.length === 1 && !key.ctrl && !key.meta && inputChar !== '\u0008' && inputChar !== '\u007f') {
            // Handle character input
            const charCode = inputChar.charCodeAt(0);
            if (charCode >= 32 && charCode <= 126) { // Allow printable ASCII characters
                if (inputField === 'name') {
                    setMigrationName(prev => prev + inputChar);
                } else if (inputField === 'author') {
                    setAuthorName(prev => prev + inputChar);
                }
            }
        } else if (key.backspace || key.delete || inputChar === '\u0008' || inputChar === '\u007f') {
            // Handle backspace and delete
            if (inputField === 'name') {
                setMigrationName(prev => prev.slice(0, -1));
            } else if (inputField === 'author') {
                setAuthorName(prev => prev.slice(0, -1));
            }
        } else if (key.ctrl && (inputChar === 'u' || inputChar === 'a')) {
            // Ctrl+U or Ctrl+A to clear current field
            if (inputField === 'name') {
                setMigrationName('');
            } else if (inputField === 'author') {
                setAuthorName('');
            }
        }
    }, [isVisible, migrationName, authorName, inputField, onComplete, onCancel]);

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
            }, '📝 Create New Migration'),

            React.createElement(Text, {
                color: 'blue',
                marginBottom: 1
            }, '🔧 Fill in migration details:'),

            // Migration name field
            React.createElement(Text, {
                color: inputField === 'name' ? 'black' : 'white',
                backgroundColor: inputField === 'name' ? 'cyan' : undefined,
                marginBottom: 0
            }, `Name: ${migrationName}${inputField === 'name' ? '|' : ''}`),

            // Author field
            React.createElement(Text, {
                color: inputField === 'author' ? 'black' : 'white',
                backgroundColor: inputField === 'author' ? 'cyan' : undefined,
                marginBottom: 0
            }, `Author: ${authorName}${inputField === 'author' ? '|' : ''}`),

            // Type display (read-only)
            React.createElement(Text, {
                color: 'gray',
                marginBottom: 1
            }, 'Type: Custom SQL'),

            React.createElement(Text, {
                color: 'gray',
                marginTop: 1
            }, 'Type to edit, ↑↓ to navigate fields, Enter to create, Esc to cancel')
        )
    );
};

module.exports = CreateDialog;
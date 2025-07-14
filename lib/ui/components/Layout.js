const React = require('react');
const { Box, Text } = require('ink');

// ASCII Logo 组件
const DBShiftLogo = () => {
    const logoLines = [
        '██████╗ ██████╗ ███████╗██╗  ██╗██╗███████╗████████╗',
        '██╔══██╗██╔══██╗██╔════╝██║  ██║██║██╔════╝╚══██╔══╝',
        '██║  ██║██████╔╝███████╗███████║██║█████╗     ██║   ',
        '██║  ██║██╔══██╗╚════██║██╔══██║██║██╔══╝     ██║   ',
        '██████╔╝██████╔╝███████║██║  ██║██║██║        ██║   ',
        '╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   '
    ];

    return React.createElement(Box, { flexDirection: 'column', alignItems: 'center', marginTop: 2, marginBottom: 2 },
        logoLines.map((line, index) =>
            React.createElement(Text, {
                key: index,
                color: index < 2 ? 'blue' : index < 4 ? 'cyan' : 'green'
            }, line)
        )
    );
};

// 欢迎提示组件
const WelcomeTips = () => {
    return React.createElement(Box, { flexDirection: 'column', marginBottom: 2 },
        React.createElement(Text, { color: 'gray' }, 'Tips for getting started:'),
        React.createElement(Text, { color: 'white' }, '• Type / to see available commands'),
        React.createElement(Text, { color: 'white' }, '• Use /init to initialize a new project'),
        React.createElement(Text, { color: 'white' }, '• Press Tab for auto-completion'),
        React.createElement(Text, { color: 'white' }, '• Use ↑↓ arrow keys for session command history (press Esc to dismiss suggestions first)'),
        React.createElement(Text, { color: 'magenta' }, '• Type /help for more information')
    );
};

// 输入框组件 - 使用 Gemini CLI 风格的光标
const InputBox = ({ value, showCursor, cursorPosition }) => {
    const displayValue = value || '';
    const chalk = require('chalk');

    let displayWithCursor = '';
    if (showCursor) {
        // 将光标插入到指定位置
        const beforeCursor = displayValue.substring(0, cursorPosition);
        const atCursor = displayValue.substring(cursorPosition, cursorPosition + 1);
        const afterCursor = displayValue.substring(cursorPosition + 1);

        if (atCursor) {
            displayWithCursor = beforeCursor + chalk.inverse(atCursor) + afterCursor;
        } else {
            // 如果光标在末尾，显示一个反色的空格
            displayWithCursor = displayValue + chalk.inverse(' ');
        }
    } else {
        displayWithCursor = displayValue;
    }

    return React.createElement(Box, {
            borderStyle: 'single',
            borderColor: 'cyan',
            paddingX: 1,
            paddingY: 0,
            marginTop: 1
        },
        React.createElement(Text, {},
            React.createElement(Text, { color: 'cyan' }, '> '),
            React.createElement(Text, {}, displayWithCursor)
        )
    );
};

// 用户输入显示组件
const UserInputBox = ({ command }) => {
    return React.createElement(Box, {
            borderStyle: 'single',
            borderColor: 'gray',
            width: '100%',
            paddingX: 1,
            marginBottom: 1
        },
        React.createElement(Text, { color: 'blue' }, '> '),
        React.createElement(Text, { color: 'cyan' }, command)
    );
};

// 命令输出框组件
const CommandOutputBox = ({ outputs }) => {
    if (!outputs || outputs.length === 0) return null;

    return React.createElement(Box, {
            borderStyle: 'single',
            borderColor: 'gray',
            width: '100%',
            paddingX: 1,
            marginBottom: 1
        },
        React.createElement(Box, { flexDirection: 'column' },
            outputs.map((output, index) =>
                React.createElement(Text, {
                    key: index,
                    color: output.type === 'error' ? 'red' :
                        output.type === 'success' ? 'green' :
                            output.type === 'warning' ? 'yellow' :
                                output.type === 'info' ? 'white' : 'gray'
                }, output.content)
            )
        )
    );
};

// 命令建议组件
const CommandSuggestions = ({ commands, selectedIndex, showCount, scrollOffset, visibleCount }) => {
    if (commands.length === 0) return null;

    const startIndex = scrollOffset;
    const endIndex = Math.min(startIndex + visibleCount, commands.length);
    const displayCommands = commands.slice(startIndex, endIndex);

    const showUpArrow = startIndex > 0;
    const showDownArrow = endIndex < commands.length;

    return React.createElement(Box, {
            flexDirection: 'column',
            marginTop: 1,
            borderStyle: 'single',
            borderColor: 'gray',
            paddingX: 1,
            paddingY: 0
        },
        React.createElement(Text, { color: 'yellow', marginBottom: 1 }, '📋 Available Commands:'),
        showUpArrow && React.createElement(Text, { color: 'gray', align: 'center' }, '▲'),
        displayCommands.map((cmd, index) =>
            React.createElement(Box, {
                    key: index,
                    flexDirection: 'row',
                    marginBottom: index < displayCommands.length - 1 ? 0 : 0
                },
                React.createElement(Text, {
                    color: (startIndex + index) === selectedIndex ? 'black' : 'cyan',
                    backgroundColor: (startIndex + index) === selectedIndex ? 'cyan' : undefined,
                    bold: (startIndex + index) === selectedIndex
                }, ((startIndex + index) === selectedIndex ? '▶ ' : '  ') + cmd.command.padEnd(18)),
                React.createElement(Text, {
                    color: (startIndex + index) === selectedIndex ? 'white' : 'gray'
                }, cmd.description)
            )
        ),
        showDownArrow && React.createElement(Text, { color: 'gray', align: 'center' }, '▼')
    );
};

module.exports = {
    DBShiftLogo,
    WelcomeTips,
    InputBox,
    UserInputBox,
    CommandOutputBox,
    CommandSuggestions
};
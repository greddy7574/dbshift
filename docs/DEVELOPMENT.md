# Development Guide

## Project Structure

```
dbshift/
├── bin/
│   └── dbshift.js                    # 双模式入口路由器
├── lib/
│   ├── cli/
│   │   └── CLIRunner.js              # CLI 模式命令路由器
│   ├── commands/                     # 业务命令处理器
│   │   ├── config/                   # 配置管理命令组
│   │   │   ├── index.js              # 显示当前配置
│   │   │   ├── init.js               # 交互式配置初始化
│   │   │   └── set.js                # 命令行配置设置
│   │   ├── create.js                 # 创建迁移文件
│   │   ├── history.js                # 历史记录查看
│   │   ├── init.js                   # 项目初始化
│   │   ├── migrate.js                # 执行迁移
│   │   ├── status.js                 # 迁移状态检查
│   │   └── test-connection.js        # 数据库连接测试
│   ├── core/                         # 核心业务模块
│   │   ├── config.js                 # 配置管理和加载
│   │   ├── database.js               # 数据库连接和 SQL 执行
│   │   └── migration.js              # 迁移文件管理和执行逻辑
│   ├── templates/                    # 文件模板
│   │   ├── migration.sql             # 迁移文件模板
│   │   └── schema.config.js          # 配置文件模板
│   ├── ui/                           # React + Ink 交互界面
│   │   ├── InteractiveApp.js         # 主交互应用组件
│   │   ├── components/               # React UI 组件
│   │   │   ├── Layout.js             # 布局组件（Logo、输入框等）
│   │   │   └── dialogs/              # 对话框组件
│   │   │       ├── ConfigDialog.js
│   │   │       ├── ConfigInitDialog.js
│   │   │       ├── ConfigSetDialog.js
│   │   │       ├── CreateDialog.js
│   │   │       └── InitDialog.js
│   │   ├── hooks/                    # React Hooks
│   │   │   ├── useCommandHistory.js  # 命令历史管理
│   │   │   └── useProjectStatus.js   # 项目状态管理
│   │   └── utils/
│   │       └── CommandProcessor.js   # 命令处理逻辑
│   └── utils/                        # 工具类库
│       ├── connectionTester.js       # 数据库连接测试工具
│       ├── errorHandler.js           # 统一错误处理机制
│       ├── errors.js                 # 自定义错误类定义
│       ├── fileUtils.js              # 文件操作和序号生成
│       ├── logger.js                 # 彩色日志输出
│       ├── progress.js               # 进度指示器
│       └── validator.js              # 输入验证
├── test/                             # Jest 测试套件
│   ├── setup.js                     # 测试环境设置
│   └── utils/                       # 工具类测试
│       ├── connectionTester.test.js
│       ├── fileUtils.sequence.test.js
│       ├── fileUtils.test.js
│       └── validator.test.js
├── docs/                            # 项目文档
│   ├── API.md                       # API 参考
│   ├── DESIGN.md                    # 设计文档
│   ├── DEVELOPMENT.md               # 开发指南（本文档）
│   └── CI-CD.md                     # CI/CD 流程
├── examples/                        # 示例项目
│   └── simple-blog/                 # 博客项目示例
├── migrations/                      # 开发测试迁移文件
├── package.json                     # NPM 包配置
├── jest.config.js                   # Jest 测试配置
└── CLAUDE.md                        # Claude Code 指导文档
```

## Development Setup

### Prerequisites
- Node.js >= 14.0.0
- MySQL >= 5.7 或 MySQL 8.x
- 终端支持 TTY（用于交互模式）

### Quick Start
```bash
# 1. 克隆仓库
git clone https://github.com/greddy7574/dbshift.git
cd dbshift

# 2. 安装依赖
npm install

# 3. 运行测试
npm test

# 4. 本地测试 CLI
node bin/dbshift.js --help

# 5. 测试交互模式
node bin/dbshift.js

# 6. 测试 CLI 模式
node bin/dbshift.js -p -- status
```

### Local Development Testing

#### Interactive Mode Testing
```bash
# 启动交互模式
node bin/dbshift.js

# 测试各个对话框
# - 项目初始化对话框
# - 创建迁移文件向导
# - 配置管理界面
```

#### CLI Mode Testing
```bash
# 项目管理
node bin/dbshift.js -p -- init
node bin/dbshift.js -p -- create "test_migration" --author="developer"

# 迁移操作
node bin/dbshift.js -p -- migrate
node bin/dbshift.js -p -- status
node bin/dbshift.js -p -- history

# 配置管理
node bin/dbshift.js -p -- config
node bin/dbshift.js -p -- ping

# 环境测试
node bin/dbshift.js -p -- status -e production
node bin/dbshift.js -p -- ping -e staging
```

#### Global Installation Testing
```bash
# 链接到全局
npm link

# 测试全局命令
dbshift                          # 交互模式
dbshift -p -- status           # CLI 模式

# 取消链接
npm unlink -g dbshift
```

## Adding New Features

### 1. Adding a New Command

#### Step 1: Create Command Handler
在 `lib/commands/` 创建新的命令处理器：

```javascript
// lib/commands/newcommand.js
const ErrorHandler = require('../utils/errorHandler');
const Logger = require('../utils/logger');

async function newCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    // 1. 参数验证
    if (!options.required) {
      throw new Error('Required parameter missing');
    }

    // 2. 业务逻辑实现
    Logger.info('Executing new command...');
    
    // 3. 结果输出
    Logger.success('Command completed successfully');
  });
}

module.exports = newCommand;
```

#### Step 2: Register CLI Route
在 `lib/cli/CLIRunner.js` 注册 CLI 路由：

```javascript
// 添加到 CLI 路由配置
program
  .command('newcommand')
  .description('Description of the new command')
  .option('-p, --param <value>', 'Parameter description')
  .action(newCommand);
```

#### Step 3: Add Interactive Mode Support
在 `lib/ui/InteractiveApp.js` 添加交互模式支持：

```javascript
// 在命令处理逻辑中添加
case 'newcommand':
  setCurrentDialog('NewCommandDialog');
  break;
```

#### Step 4: Create Dialog (if needed)
如果需要复杂交互，创建对话框组件：

```javascript
// lib/ui/components/dialogs/NewCommandDialog.js
const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState } = React;

function NewCommandDialog({ onSubmit, onCancel }) {
  const [input, setInput] = useState('');

  useInput((input, key) => {
    if (key.return) {
      onSubmit({ param: input });
    }
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Enter parameter:</Text>
      <Text>{input}</Text>
    </Box>
  );
}

module.exports = NewCommandDialog;
```

#### Step 5: Add Tests
创建测试文件：

```javascript
// test/commands/newcommand.test.js
const newCommand = require('../../lib/commands/newcommand');

describe('newCommand', () => {
  test('should execute successfully with valid parameters', async () => {
    // 测试逻辑
  });
  
  test('should throw error with invalid parameters', async () => {
    // 错误情况测试
  });
});
```

### 2. Adding Utility Functions

#### Step 1: Create Utility Module
```javascript
// lib/utils/newutil.js
class NewUtil {
  static processData(data) {
    // 工具函数实现
    return processedData;
  }
  
  static validateInput(input) {
    // 验证逻辑
    return isValid;
  }
}

module.exports = NewUtil;
```

#### Step 2: Add Comprehensive Tests
```javascript
// test/utils/newutil.test.js
const NewUtil = require('../../lib/utils/newutil');

describe('NewUtil', () => {
  describe('processData', () => {
    test('should process data correctly', () => {
      const input = { test: 'data' };
      const result = NewUtil.processData(input);
      expect(result).toBeDefined();
    });
  });
  
  describe('validateInput', () => {
    test('should validate correct input', () => {
      expect(NewUtil.validateInput('valid')).toBe(true);
    });
    
    test('should reject invalid input', () => {
      expect(NewUtil.validateInput('')).toBe(false);
    });
  });
});
```

### 3. Adding React Components

#### Creating Dialog Components
```javascript
// lib/ui/components/dialogs/CustomDialog.js
const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useEffect } = React;

function CustomDialog({ onSubmit, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState(initialData);
  const [currentField, setCurrentField] = useState(0);
  
  const fields = [
    { name: 'field1', label: 'Field 1:', required: true },
    { name: 'field2', label: 'Field 2:', required: false }
  ];

  useInput((input, key) => {
    if (key.return) {
      if (currentField < fields.length - 1) {
        setCurrentField(currentField + 1);
      } else {
        onSubmit(formData);
      }
    }
    
    if (key.escape) {
      onCancel();
    }
    
    // 字符输入处理
    if (input && !key.ctrl && !key.meta) {
      const fieldName = fields[currentField].name;
      setFormData(prev => ({
        ...prev,
        [fieldName]: (prev[fieldName] || '') + input
      }));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Custom Dialog</Text>
      
      {fields.map((field, index) => (
        <Box key={field.name} marginTop={1}>
          <Text color={index === currentField ? 'blue' : 'white'}>
            {field.label} {formData[field.name] || ''}
          </Text>
        </Box>
      ))}
      
      <Box marginTop={1}>
        <Text color="gray">Press Enter to continue, Esc to cancel</Text>
      </Box>
    </Box>
  );
}

module.exports = CustomDialog;
```

#### Creating Custom Hooks
```javascript
// lib/ui/hooks/useCustomHook.js
const { useState, useEffect } = require('react');

function useCustomHook(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  
  const updateValue = async (newValue) => {
    setLoading(true);
    try {
      // 异步操作
      await someAsyncOperation(newValue);
      setValue(newValue);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    value,
    loading,
    updateValue
  };
}

module.exports = useCustomHook;
```

## Testing

### Running Tests

```bash
# 运行所有测试
npm test

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- --testPathPattern=fileUtils.test.js

# 运行特定测试套件
npm test -- --testNamePattern="generateSequence"
```

### Writing Tests

#### Unit Test Template
```javascript
// test/utils/example.test.js
const ExampleUtil = require('../../lib/utils/example');

describe('ExampleUtil', () => {
  beforeEach(() => {
    // 每个测试前的设置
  });
  
  afterEach(() => {
    // 每个测试后的清理
  });
  
  describe('methodName', () => {
    test('should handle normal case', () => {
      const result = ExampleUtil.methodName('input');
      expect(result).toBe('expected');
    });
    
    test('should handle edge case', () => {
      expect(() => {
        ExampleUtil.methodName(null);
      }).toThrow('Expected error message');
    });
  });
});
```

#### Integration Test Template
```javascript
// test/integration/command.test.js
const command = require('../../lib/commands/example');

describe('Command Integration', () => {
  test('should execute command end-to-end', async () => {
    // 设置测试数据
    const options = { param: 'test' };
    
    // 执行命令
    await expect(command(options)).resolves.not.toThrow();
  });
});
```

### Test Database Setup

```javascript
// test/setup.js
const Database = require('../lib/core/database');

// 测试数据库配置
const testConfig = {
  host: 'localhost',
  port: 3306,
  user: 'test_user',
  password: 'test_password',
  database: 'dbshift_test'
};

// 测试前设置
beforeAll(async () => {
  const db = new Database(testConfig);
  await db.connect();
  await db.initializeMigrationTable();
  await db.disconnect();
});

// 测试后清理
afterAll(async () => {
  const db = new Database(testConfig);
  await db.connect();
  await db.executeSQL('DROP TABLE IF EXISTS `dbshift`.`migration_history`');
  await db.disconnect();
});
```

## Code Style and Standards

### Error Handling Pattern
```javascript
// 统一的错误处理模式
async function commandHandler(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    // 参数验证
    if (!options.required) {
      throw new ValidationError('Required parameter missing');
    }
    
    try {
      // 业务逻辑
      const result = await businessLogic(options);
      
      // 成功反馈
      Logger.success('Operation completed');
      return result;
    } catch (error) {
      // 错误转换
      if (error.code === 'ECONNREFUSED') {
        throw new DatabaseError('Database connection failed', error);
      }
      throw error;
    }
  });
}
```

### React Component Pattern
```javascript
// React 组件标准模式
const React = require('react');
const { Box, Text, useInput } = require('ink');
const { useState, useEffect } = React;

function ComponentName({ 
  prop1, 
  prop2, 
  onAction, 
  onCancel 
}) {
  // State 声明
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // 副作用逻辑
  }, [dependencies]);
  
  // Input 处理
  useInput((input, key) => {
    // 键盘事件处理
  });
  
  // Render
  return (
    <Box flexDirection="column">
      {/* JSX 内容 */}
    </Box>
  );
}

module.exports = ComponentName;
```

### File Structure Conventions

#### Command Files
- 文件名：小写，连字符分隔（如 `test-connection.js`）
- 导出：单一异步函数
- 错误处理：使用 `ErrorHandler.executeWithErrorHandling`

#### Utility Files
- 文件名：小写驼峰命名（如 `fileUtils.js`）
- 导出：类或对象，包含静态方法
- 测试：100% 覆盖率目标

#### React Components
- 文件名：大写驼峰命名（如 `CreateDialog.js`）
- 导出：单一 React 组件函数
- Props：使用解构，提供默认值

## Environment Setup

### Development Environment
```javascript
// schema.config.js for development
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'dev_password',
    database: 'dbshift_dev'
  }
};
```

### Test Environment
```javascript
// 测试环境配置
module.exports = {
  test: {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'dbshift_test'
  }
};
```

### CI Environment
```bash
# GitHub Actions 环境变量
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=dbshift_ci
```

## Debugging

### Interactive Mode Debugging
```javascript
// 在 React 组件中添加调试信息
const [debugInfo, setDebugInfo] = useState('');

useEffect(() => {
  setDebugInfo(JSON.stringify(state, null, 2));
}, [state]);

// 显示调试面板
if (process.env.NODE_ENV === 'development') {
  return (
    <Box flexDirection="column">
      {/* 正常UI */}
      <Box marginTop={1} borderStyle="single">
        <Text>{debugInfo}</Text>
      </Box>
    </Box>
  );
}
```

### CLI Mode Debugging
```javascript
// 添加详细日志
const debug = require('debug')('dbshift:command');

async function command(options) {
  debug('Command started with options:', options);
  
  try {
    const result = await businessLogic(options);
    debug('Command completed:', result);
    return result;
  } catch (error) {
    debug('Command failed:', error);
    throw error;
  }
}
```

### Database Query Debugging
```javascript
// 在 Database 类中添加查询日志
async executeSQL(sql) {
  if (process.env.DEBUG_SQL) {
    console.log('Executing SQL:', sql);
  }
  
  const result = await this.connection.execute(sql);
  
  if (process.env.DEBUG_SQL) {
    console.log('Query result:', result);
  }
  
  return result;
}
```

## Release Process

### Version Management
```bash
# 更新版本号
npm version patch    # 0.3.33 -> 0.3.34
npm version minor    # 0.3.33 -> 0.4.0
npm version major    # 0.3.33 -> 1.0.0
```

### Pre-release Checklist
- [ ] 所有测试通过 (`npm test`)
- [ ] 覆盖率达标 (`npm run test:coverage`)
- [ ] 文档更新完成
- [ ] CHANGELOG.md 更新
- [ ] 本地测试完整功能

### Release Steps
```bash
# 1. 创建发布分支
git checkout -b release/v0.4.0

# 2. 更新版本和文档
npm version minor
git add .
git commit -m "chore: prepare release v0.4.0"

# 3. 合并到主分支
git checkout main
git merge release/v0.4.0

# 4. 创建标签（触发 CI/CD）
git tag v0.4.0
git push origin main --tags
```

## Troubleshooting

### Common Development Issues

#### React + Ink Issues
```bash
# 清理 React 相关问题
rm -rf node_modules
npm install

# 检查 Ink 版本兼容性
npm ls ink
```

#### Database Connection Issues
```javascript
// 添加连接测试
const result = await ConnectionTester.testConnection(config);
if (!result.success) {
  console.error('Connection failed:', result.message);
}
```

#### CLI Parameter Issues
```javascript
// 调试 Commander.js 参数解析
program.configureOutput({
  writeOut: (str) => console.log('OUT:', str),
  writeErr: (str) => console.error('ERR:', str)
});
```

### Performance Optimization

#### File System Operations
```javascript
// 使用异步操作避免阻塞
const files = await fs.promises.readdir(migrationsDir);
const fileContents = await Promise.all(
  files.map(file => fs.promises.readFile(file, 'utf8'))
);
```

#### Database Operations
```javascript
// 使用连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database
});
```

---

这份开发指南提供了 DBShift 项目开发的完整流程和最佳实践，确保代码质量和开发效率。
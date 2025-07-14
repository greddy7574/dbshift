# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBShift 是一个现代化的 MySQL 数据库迁移工具，灵感来自 Flyway。项目采用创新的双模式架构：交互模式（基于 React + Ink）和 CLI 模式（基于 Commander.js），为不同使用场景提供最佳的用户体验。

### 核心特性
- 🎯 **双模式架构**: 交互模式（React + Ink 终端 UI）+ CLI 模式（Commander.js）
- ⚡ **React 交互界面**: 基于 Ink 的现代终端用户界面，支持对话框和实时反馈
- 🔄 **统一错误处理**: ErrorHandler 提供一致的错误处理机制
- 🔢 **作者分组序号**: 每个开发者独立的序号系统，避免团队协作冲突
- 📜 **丰富历史功能**: 详细的迁移执行历史，支持按作者过滤和多环境查看
- ⚙️ **灵活配置管理**: 支持 .env 和 schema.config.js 两种配置方式
- 🏓 **连接测试**: ping 命令快速测试数据库连接，支持临时参数和多环境
- 🌍 **多环境支持**: development, staging, production 环境隔离

## 技术架构

### 技术栈
- **交互 UI**: React (^17.0.2) + Ink (^3.2.0) - 现代终端 UI 框架
- **CLI**: Commander.js (^14.0.0) - 命令行参数解析和路由
- **数据库**: MySQL2 (^3.11.0) - Promise-based MySQL 驱动
- **用户交互**: Inquirer (^8.2.6) - 对话框和表单交互
- **样式**: Chalk (4.1.2) - 终端颜色输出
- **配置**: dotenv (^16.0.1) - 环境变量管理
- **测试**: Jest (^30.0.2) - 测试框架
- **编译**: Babel - React/JSX 支持

### 项目结构

```
dbshift/
├── bin/
│   └── dbshift.js                    # 主入口（双模式路由器）
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
```

## 核心架构设计

### 双模式入口设计

#### 主入口 (`bin/dbshift.js`)
```javascript
// 命令行参数检测
if (args.includes('-p')) {
    // CLI 模式：dbshift -p -- command args
    executeCommandLine(command);
} else {
    // 交互模式：React + Ink 应用
    startInteractiveMode();
}
```

**路由逻辑**:
- **交互模式**: 直接启动 `startInteractiveMode()` - React + Ink 应用
- **CLI 模式**: 通过 `-p --` 参数触发 `executeCommandLine()` - Commander.js 处理
- **帮助模式**: `-h`、`--help` 显示使用说明

#### 交互模式 (`lib/ui/InteractiveApp.js`)
```javascript
// React + Ink 应用架构
function startInteractiveMode() {
  // TTY 检查和环境初始化
  // 渲染主 React 组件
  render(<DBShiftApp />);
}

// 主应用组件
function DBShiftApp() {
  // useState hooks 管理应用状态
  // useInput hook 处理用户输入
  // 对话框状态管理
  // 命令执行和反馈显示
}
```

**特性**:
- **React 组件架构**: 使用 useState、useEffect 等 Hooks
- **对话框系统**: 复杂命令使用专门的对话框组件
- **实时反馈**: Ink 提供的终端 UI 更新
- **TTY 检测**: 自动回退到 CLI 模式（非终端环境）

#### CLI 模式 (`lib/cli/CLIRunner.js`)
```javascript
// Commander.js 程序配置
function executeCommandLine(command) {
  const { program } = require('commander');
  
  // 注册所有命令
  program.command('init').action(initCommand);
  program.command('create <name>').action(createCommand);
  program.command('migrate').action(migrateCommand);
  // ...其他命令
  
  // 解析和执行
  program.parse(['node', 'dbshift', ...commandArgs]);
}
```

**特性**:
- **Commander.js 路由**: 标准的 CLI 命令解析
- **参数验证**: 自动处理必需参数和选项
- **批处理友好**: 适合脚本和 CI/CD 环境
- **错误退出**: 失败时正确设置退出码

### 配置管理系统

#### 配置加载策略 (`lib/core/config.js`)
```javascript
class Config {
  static getCurrentConfig(env = 'development') {
    // 1. 优先加载 schema.config.js（多环境）
    if (FileUtils.exists('schema.config.js')) {
      const config = require('./schema.config.js');
      return config[env] || config;
    }
    
    // 2. 回退到 .env 文件（简单配置）
    if (FileUtils.exists('.env')) {
      dotenv.config();
      return extractFromEnv();
    }
    
    // 3. 使用环境变量（生产环境）
    return extractFromEnv();
  }
}
```

**配置格式支持**:

1. **schema.config.js** - 多环境配置
```javascript
module.exports = {
  development: { 
    host: 'localhost', port: 3306, 
    user: 'root', password: 'dev',
    database: 'myapp_dev' 
  },
  production: { 
    host: 'prod-host', port: 3306,
    user: 'root', password: 'prod',
    database: 'myapp_prod' 
  }
};
```

2. **.env** - 简单配置
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=myapp
```

### 迁移文件管理

#### 文件命名系统 (`lib/utils/fileUtils.js`)
```
格式: YYYYMMDDNN_Author_description.sql
示例: 20250714001_Greddy_create_users_table.sql
```

**作者分组序号机制**:
```javascript
// 每个作者独立序号，避免冲突
generateSequence(dir, date, author) {
  // 1. 扫描同日期、同作者的文件
  // 2. 解析序号，找出最大值
  // 3. 返回 max + 1
}

// 示例：同一天不同作者可用相同序号
20250714001_Alice_feature_a.sql  // Alice 的第 1 个
20250714001_Bob_feature_b.sql    // Bob 的第 1 个（无冲突）
20250714002_Alice_feature_c.sql  // Alice 的第 2 个
```

#### 迁移模板系统 (`lib/templates/migration.sql`)
```sql
-- Migration: {{DESCRIPTION}}
-- Author: {{AUTHOR}}
-- Created: {{DATE}}
-- Version: {{VERSION}}

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `{{DATABASE_NAME}}` DEFAULT CHARACTER SET utf8mb4;
USE `{{DATABASE_NAME}}`;

-- Add your SQL statements here
-- 支持标准 SQL 语法和注释
```

### 数据库架构

#### 迁移历史表
```sql
CREATE TABLE `dbshift`.`migration_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT '版本号',
  `author` varchar(20) NOT NULL COMMENT '作者',
  `file_desc` varchar(100) NOT NULL COMMENT '文件描述',
  `file_name` varchar(200) NOT NULL COMMENT '文件名',
  `status` tinyint(1) DEFAULT '0' COMMENT '0=待执行, 1=已完成',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modify_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_author` (`version`, `author`)
);
```

**失败重试机制**:
- 唯一约束 `(version, author)` 防止重复记录
- 失败时 `status=0`，可重新执行
- 成功时更新 `status=1` 和 `modify_date`

### 错误处理系统

#### 统一错误处理 (`lib/utils/errorHandler.js`)
```javascript
class ErrorHandler {
  static async executeWithErrorHandling(fn) {
    try {
      await fn();
      // 交互模式：不退出进程
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(0);
      }
    } catch (error) {
      const exitCode = this.handle(error);
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(exitCode);  // CLI 模式：退出进程
      } else {
        throw error;             // 交互模式：抛出给 React 处理
      }
    }
  }
}
```

**模式区分**:
- **CLI 模式**: 错误时 `process.exit()` 设置正确退出码
- **交互模式**: 错误时抛出异常，由 React 组件捕获并显示

## 开发指南

### 本地开发测试

```bash
# 交互模式开发测试
node bin/dbshift.js

# CLI 模式开发测试
node bin/dbshift.js -p -- init
node bin/dbshift.js -p -- create "test_migration" --author="developer"
node bin/dbshift.js -p -- migrate
node bin/dbshift.js -p -- status
node bin/dbshift.js -p -- history
node bin/dbshift.js -p -- config
node bin/dbshift.js -p -- ping
```

### 全局安装测试
```bash
npm link                    # 链接到全局
dbshift                     # 测试交互模式
dbshift -p -- status       # 测试 CLI 模式
npm unlink -g dbshift      # 取消链接
```

### 关键开发要点

#### 1. 添加新命令
```javascript
// 1. 创建命令处理器: lib/commands/newcommand.js
async function newCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    // 命令逻辑实现
  });
}

// 2. 注册 CLI 路由: lib/cli/CLIRunner.js
program
  .command('newcommand')
  .description('Command description')
  .action(newCommand);

// 3. 添加交互模式支持: lib/ui/InteractiveApp.js
// 在对话框或命令处理中集成
```

#### 2. React 组件开发
```javascript
// 使用 Ink 组件和 React Hooks
const { Box, Text, useInput } = require('ink');
const { useState, useEffect } = require('react');

function NewDialog({ onSubmit, onCancel }) {
  const [input, setInput] = useState('');
  
  useInput((input, key) => {
    if (key.return) {
      onSubmit(input);
    }
    if (key.escape) {
      onCancel();
    }
  });
  
  return (
    <Box flexDirection="column">
      <Text>Input something:</Text>
      <Text>{input}</Text>
    </Box>
  );
}
```

#### 3. 配置扩展
```javascript
// 在 lib/core/config.js 中扩展配置加载
static getCurrentConfig(env) {
  // 添加新的配置格式支持
  if (FileUtils.exists('newconfig.json')) {
    return JSON.parse(fs.readFileSync('newconfig.json'));
  }
  // 现有逻辑...
}
```

## 用户使用指南

### 交互模式使用

```bash
# 启动交互模式
dbshift

# 主要功能
- 项目初始化对话框
- 创建迁移文件向导
- 配置管理界面
- 实时状态显示
- 错误反馈和重试
```

**交互模式特性**:
- **对话框驱动**: 复杂操作通过表单对话框引导
- **实时反馈**: 命令执行状态实时更新
- **错误恢复**: 错误后自动返回主界面
- **键盘导航**: ESC 取消，回车确认，箭头键选择

### CLI 模式使用

```bash
# 基本命令格式
dbshift -p -- <command> [options]

# 项目管理
dbshift -p -- init
dbshift -p -- create "create_users_table" --author=john
dbshift -p -- create "add_email_index" -a john

# 迁移操作
dbshift -p -- migrate
dbshift -p -- migrate -e production
dbshift -p -- status
dbshift -p -- status -e staging

# 历史查看
dbshift -p -- history
dbshift -p -- history --author=john
dbshift -p -- history -e production

# 配置管理
dbshift -p -- config
dbshift -p -- config-init
dbshift -p -- config-set --host=localhost --user=root --password=123456

# 连接测试
dbshift -p -- ping
dbshift -p -- ping -e production
dbshift -p -- ping --host=localhost --user=root --password=123456
```

## 测试和部署

### 测试命令
```bash
npm test              # 运行 Jest 测试套件
npm run test:watch    # 监视模式测试
npm run test:coverage # 生成覆盖率报告
```

### NPM 脚本
```bash
npm start           # 启动交互模式
npm run cli         # 测试 CLI 模式
npm run dev         # 开发模式
npm run demo        # 演示命令
```

### 部署配置
```json
{
  "bin": {
    "dbshift": "bin/dbshift.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## SQL 迁移文件编写

### 标准模板结构
- **元数据注释**: 描述、作者、日期、版本
- **数据库创建**: CREATE DATABASE IF NOT EXISTS
- **表结构定义**: CREATE TABLE、ALTER TABLE
- **索引管理**: CREATE INDEX、DROP INDEX
- **数据操作**: INSERT、UPDATE（谨慎使用）

### 最佳实践
1. **幂等性**: 使用 `IF NOT EXISTS`、`IF EXISTS` 语句
2. **单一职责**: 每个文件只处理一个功能或表
3. **向前兼容**: 避免破坏性更改
4. **备份策略**: 重要数据变更前备份

---

这份重写的文档准确反映了当前代码架构，特别是 React + Ink 交互模式和 Commander.js CLI 模式的双模式设计。
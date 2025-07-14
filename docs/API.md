# API Reference

## Core Classes

### Database

数据库连接和SQL执行的核心类。

```javascript
const Database = require('./lib/core/database');

const db = new Database({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'myapp'
});

await db.connect();
await db.executeSQLFile('/path/to/migration.sql');
await db.disconnect();
```

#### Methods

- `connect()` - 建立数据库连接
- `disconnect()` - 关闭数据库连接
- `initializeMigrationTable()` - 创建迁移跟踪表 (`dbshift.migration_history`)
- `executeSQL(sql)` - 执行SQL查询
- `executeSQLFile(filePath)` - 执行SQL文件，支持标准SQL语法

#### executeSQLFile Method

**标准SQL处理**: DBShift 支持标准SQL文件处理，兼容任何SQL编辑器。

```javascript
const Database = require('./lib/core/database');

const db = new Database(config);
await db.connect();
await db.executeSQLFile('./migrations/20250714001_create_users.sql');
```

**处理逻辑:**
```javascript
async executeSQLFile(filePath) {
  const content = FileUtils.readFile(filePath);
  const statements = content
    .split(';')                           // 分号分割
    .map(stmt => stmt.trim())             // 清理空白
    .filter(stmt => stmt.length > 0)      // 过滤空语句
    .filter(stmt => !stmt.startsWith('--')); // 过滤注释
  
  for (const statement of statements) {
    await this.executeSQL(statement);
  }
}
```

### Config

配置管理和加载系统。

```javascript
const Config = require('./lib/core/config');

// 获取当前环境配置
const config = Config.getCurrentConfig('development');

// 创建配置实例
const configInstance = new Config('production');
const prodConfig = configInstance.load();
```

#### Methods

- `static getCurrentConfig(env)` - 获取指定环境的配置
- `load()` - 加载配置文件
- `validate()` - 验证配置完整性
- `getConnectionConfig()` - 获取数据库连接配置

#### Configuration Loading Priority

1. `schema.config.js` - 多环境配置文件（优先）
2. `.env` - 环境变量文件（回退）
3. `process.env` - 系统环境变量（生产）

### Migration

迁移文件管理和执行逻辑。

```javascript
const Migration = require('./lib/core/migration');

const migration = new Migration('./migrations', config);

// 获取待执行的迁移
const pending = await migration.getPendingMigrations();

// 执行迁移
await migration.executeMigration(migrationFile);

// 获取迁移历史
const history = await migration.getHistory();
```

#### Methods

- `scanMigrationFiles()` - 扫描迁移文件目录
- `getPendingMigrations()` - 获取待执行的迁移
- `executeMigration(file)` - 执行单个迁移文件
- `getHistory(author?, env?)` - 获取迁移历史记录
- `validateMigrationFile(file)` - 验证迁移文件格式

## Utility Classes

### FileUtils

文件操作和序号生成工具类。

```javascript
const FileUtils = require('./lib/utils/fileUtils');

// 生成序号（作者分组）
const sequence = FileUtils.generateSequence('./migrations', '20250714', 'Alice');
// 返回: '001', '002', 等

// 文件操作
const exists = FileUtils.exists('./schema.config.js');
const content = FileUtils.readFile('./migration.sql');
FileUtils.writeFile('./new-file.sql', content);
```

#### Methods

- `generateSequence(dir, date, author)` - 生成作者分组序号
- `exists(path)` - 检查文件是否存在
- `readFile(path)` - 读取文件内容
- `writeFile(path, content)` - 写入文件内容
- `sanitizeFileName(name)` - 清理文件名

#### Author-Grouped Sequence Generation

```javascript
// 每个作者独立的序号系统
FileUtils.generateSequence('./migrations', '20250714', 'Alice'); // '001'
FileUtils.generateSequence('./migrations', '20250714', 'Bob');   // '001' (无冲突)
FileUtils.generateSequence('./migrations', '20250714', 'Alice'); // '002'
```

### Logger

彩色日志输出工具类。

```javascript
const Logger = require('./lib/utils/logger');

Logger.info('信息消息');
Logger.success('成功消息');
Logger.warning('警告消息');
Logger.error('错误消息');
```

#### Methods

- `info(message)` - 蓝色信息日志
- `success(message)` - 绿色成功日志
- `warning(message)` - 黄色警告日志
- `error(message)` - 红色错误日志

### ErrorHandler

统一错误处理机制。

```javascript
const ErrorHandler = require('./lib/utils/errorHandler');

// 使用错误处理包装器
await ErrorHandler.executeWithErrorHandling(async () => {
  // 业务逻辑
  await someOperation();
});
```

#### Methods

- `static executeWithErrorHandling(fn)` - 执行函数并处理错误
- `static handle(error)` - 处理和记录错误
- `static getExitCode(error)` - 获取错误退出码

#### Mode-Specific Error Handling

```javascript
// CLI 模式：错误时退出进程
if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
  process.exit(exitCode);
} else {
  // 交互模式：抛出异常给 React 组件处理
  throw error;
}
```

### ConnectionTester

数据库连接测试工具。

```javascript
const ConnectionTester = require('./lib/utils/connectionTester');

// 测试连接
const result = await ConnectionTester.testConnection(config);
console.log(result.success); // true/false
console.log(result.message); // 详细信息
```

#### Methods

- `static testConnection(config)` - 测试数据库连接
- `static testWithTimeout(config, timeout)` - 带超时的连接测试

## React + Ink Components

### InteractiveApp

主交互应用组件。

```javascript
const { startInteractiveMode } = require('./lib/ui/InteractiveApp');

// 启动交互模式
startInteractiveMode();
```

### Dialog Components

对话框组件用于复杂的用户交互。

```javascript
// 使用示例在交互模式中
const InitDialog = require('./lib/ui/components/dialogs/InitDialog');
const CreateDialog = require('./lib/ui/components/dialogs/CreateDialog');
const ConfigDialog = require('./lib/ui/components/dialogs/ConfigDialog');
```

#### Available Dialogs

- `InitDialog` - 项目初始化对话框
- `CreateDialog` - 创建迁移文件对话框
- `ConfigDialog` - 配置管理对话框
- `ConfigInitDialog` - 配置初始化对话框
- `ConfigSetDialog` - 配置设置对话框

### React Hooks

自定义 React Hooks 用于状态管理。

```javascript
const useCommandHistory = require('./lib/ui/hooks/useCommandHistory');
const useProjectStatus = require('./lib/ui/hooks/useProjectStatus');
```

#### Hooks

- `useCommandHistory()` - 命令历史记录管理
- `useProjectStatus()` - 项目状态管理

## CLI Commands

### Command Structure

所有CLI命令都使用统一的错误处理机制：

```javascript
// 命令处理器模板
async function commandHandler(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    // 命令实现逻辑
  });
}
```

### Available Commands

#### init
项目初始化命令。

```bash
dbshift -p -- init
```

#### create
创建新的迁移文件。

```bash
dbshift -p -- create "migration_name" --author="author_name"
dbshift -p -- create "add_user_index" -a "john"
```

#### migrate
执行待处理的迁移。

```bash
dbshift -p -- migrate
dbshift -p -- migrate -e production
```

#### status
查看迁移状态。

```bash
dbshift -p -- status
dbshift -p -- status -e staging
```

#### history
查看迁移历史记录。

```bash
dbshift -p -- history
dbshift -p -- history --author=john
dbshift -p -- history -e production
```

#### config
配置管理命令。

```bash
dbshift -p -- config                 # 显示当前配置
dbshift -p -- config-init            # 交互式配置初始化
dbshift -p -- config-set --host=localhost --user=root
```

#### ping
测试数据库连接。

```bash
dbshift -p -- ping
dbshift -p -- ping -e production
dbshift -p -- ping --host=localhost --user=root --password=123456
```

## Entry Points

### Dual Mode Architecture

DBShift 提供两种使用模式：

#### Interactive Mode (React + Ink)
```bash
dbshift
```

现代终端UI，支持：
- 对话框驱动的操作
- 实时状态反馈
- 键盘导航
- 错误恢复

#### CLI Mode (Commander.js)
```bash
dbshift -p -- <command> [options]
```

传统命令行，支持：
- 脚本自动化
- CI/CD 集成
- 批处理操作
- 标准退出码

## Error Classes

### Custom Error Types

```javascript
const { 
  DatabaseError, 
  ValidationError, 
  ConfigurationError 
} = require('./lib/utils/errors');

// 使用示例
throw new DatabaseError('连接失败', originalError);
throw new ValidationError('配置验证失败');
throw new ConfigurationError('配置文件不存在');
```

## Migration File Format

### Naming Convention

```
YYYYMMDDNN_Author_description.sql
```

示例：
- `20250714001_Alice_create_users_table.sql`
- `20250714002_Alice_add_email_index.sql`
- `20250714001_Bob_create_posts_table.sql`

### Template Variables

迁移文件模板支持变量替换：

```sql
-- Migration: {{DESCRIPTION}}
-- Author: {{AUTHOR}}
-- Created: {{DATE}}
-- Version: {{VERSION}}

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `{{DATABASE_NAME}}` DEFAULT CHARACTER SET utf8mb4;
USE `{{DATABASE_NAME}}`;
```

## Database Schema

### Migration History Table

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

## Environment Variables

### Mode Detection

- `DBSHIFT_INTERACTIVE_MODE` - 区分交互模式和CLI模式

### Configuration Variables

- `MYSQL_HOST` - 数据库主机
- `MYSQL_PORT` - 数据库端口
- `MYSQL_USERNAME` - 数据库用户名
- `MYSQL_PASSWORD` - 数据库密码
- `MYSQL_DATABASE` - 数据库名称
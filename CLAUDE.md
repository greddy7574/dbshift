# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBShift 是一个现代化的 MySQL 数据库迁移工具，灵感来自 Flyway。它提供了简单易用的 CLI 界面，用于数据库版本控制和自动化迁移。项目采用 Node.js + MySQL2 技术栈，设计为全局 npm 包。

## 核心架构

### CLI 工具结构
- `bin/schema.js`: CLI 入口文件，处理命令行参数
- `lib/commands/`: 各个命令的实现（init, migrate, status, create, config）
- `lib/core/`: 核心功能模块（database, config, migration）
- `package.json`: NPM 包配置，包含 bin 字段用于全局安装

### 迁移文件命名规范
SQL 迁移文件遵循严格的命名规范：`YYYYMMDDNN_Author_description.sql`
- `YYYYMMDDNN`: 版本号（年月日+序号）
- `Author`: 作者名（如 Admin, Greddy 等）
- `description`: 功能描述

示例：`20241220001_Admin_create_users_table.sql`

### 用户项目结构
用户使用 CLI 工具后的项目结构：
```
user-project/
├── migrations/           # 迁移 SQL 文件目录
├── .env                 # 简单配置文件
└── schema.config.js     # 高级配置文件（可选）
```

## 开发和测试

### 本地测试 CLI 工具
```bash
node bin/schema.js --help
node bin/schema.js init
node bin/schema.js migrate
```

### 全局安装测试
```bash
npm link                    # 本地链接到全局
schema --help              # 测试全局命令
npm unlink -g schema-shift # 取消链接
```

### 发布到 NPM
```bash
npm publish
```

## 环境配置

### 支持两种配置方式

1. **简单配置 (.env)**
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
```

2. **高级配置 (schema.config.js)**
```javascript
module.exports = {
  development: { host: 'localhost', port: 3306, user: 'root', password: 'dev' },
  production: { host: 'prod-host', port: 3306, user: 'root', password: 'prod' }
};
```

## CLI 命令

### 开发时常用命令
```bash
# 测试 CLI 功能
node bin/dbshift.js init
node bin/dbshift.js create test_migration
node bin/dbshift.js migrate
node bin/dbshift.js status

# 配置管理测试
node bin/dbshift.js config
node bin/dbshift.js config-init
node bin/dbshift.js config-set --host=testhost --user=testuser
```

### 用户使用命令
```bash
# 全局安装后
npm install -g dbshift
dbshift init
dbshift create create_users_table
dbshift migrate
dbshift status

# 配置管理命令 (v0.2.0+)
dbshift config                    # 显示当前配置
dbshift config-init               # 交互式配置设置
dbshift config-set --host=localhost --user=root --password=123456
```

## 核心模块说明

### Database (lib/core/database.js)
- 管理 MySQL 连接
- 执行 SQL 文件和语句
- 初始化迁移表（dbshift.migration_history）
- 支持失败重试的唯一约束和时间戳跟踪

### MigrationManager (lib/core/migration.js)
- 扫描和管理迁移文件
- 跟踪迁移状态（pending=0, completed=1）
- 执行迁移逻辑
- 支持失败重试机制，自动更新 modify_date

### Config (lib/core/config.js)
- 加载和验证配置
- 支持多环境配置
- 处理 .env 和 .js 配置文件

## SQL 文件编写注意事项

1. 支持多语句执行，使用 `;;` 作为语句分隔符
2. 自动移除 `DELIMITER` 指令
3. 空语句会被自动过滤
4. 每个迁移文件应该是幂等的，可以安全重复执行
5. 使用模板系统生成标准化的迁移文件

## 错误处理和用户体验

- 使用 chalk 提供彩色控制台输出
- 详细的错误信息和解决建议
- 交互式配置界面（inquirer）
- 进度提示和状态显示

## 数据库设计

### migration_history 表结构
```sql
CREATE TABLE `dbshift`.`migration_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) CHARACTER SET utf8mb4 NOT NULL COMMENT '版本號',
  `author` varchar(20) CHARACTER SET utf8mb4 NOT NULL COMMENT '作者',
  `file_desc` varchar(100) CHARACTER SET utf8mb4 NOT NULL COMMENT '檔名描述',
  `file_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL COMMENT '檔名',
  `status` tinyint(1) DEFAULT '0' COMMENT '狀態: 0=待執行, 1=已完成',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `modify_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_author` (`version`, `author`)
);
```

### 失败重试机制
- 使用 `(version, author)` 唯一约束防止重复记录
- 执行失败时记录保持 `status=0`，可重新执行
- 重新执行时更新 `modify_date` 和重置状态
- 支持追踪迁移的完整执行历史

## 配置管理架构 (v0.2.0+)

### 配置命令结构
- `lib/commands/config/index.js` - 显示配置命令
- `lib/commands/config/init.js` - 交互式配置设置
- `lib/commands/config/set.js` - 命令行配置设置

### 配置管理特性
- **多环境支持**: development, production, staging 等
- **智能文件检测**: 自动识别 .env 或 schema.config.js
- **环境变量回退**: production 环境自动使用环境变量
- **连接测试**: 配置后自动验证数据库连接
- **灵活更新**: 支持单独更新特定配置项

## 技术栈

- **CLI**: Commander.js 处理命令行
- **UI**: Chalk (颜色) + Inquirer (交互)
- **数据库**: MySQL2 (promise-based)
- **配置**: dotenv + 自定义 JS 配置
- **Node**: >= 14.0.0
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBShift 是一个现代化的 MySQL 数据库迁移工具，灵感来自 Flyway。项目采用创新的双模式架构：交互模式（基于 React + Ink）和 CLI 模式（基于 Commander.js），为不同使用场景提供最佳的用户体验。

### 核心特性
- 🎯 **双模式架构**: 交互模式（现代终端 UI）+ CLI 模式（传统命令行）
- ⚡ **即时自动补全**: 输入"/"立即显示命令，支持智能过滤和 Tab 补全
- 🔄 **完美会话持久性**: 所有命令执行后保持交互状态，统一错误处理机制
- 🔢 **作者分组序号**: 每个开发者独立的序号系统，避免团队协作冲突
- 📜 **丰富历史功能**: 详细的迁移执行历史，支持按作者过滤和多环境查看
- ⚙️ **灵活配置管理**: 支持 .env 和 schema.config.js 两种配置方式
- 🏓 **连接测试**: ping 命令快速测试数据库连接，支持临时参数和多环境
- 🌍 **多环境支持**: development, staging, production 环境隔离

## 技术架构

### 技术栈
- **前端**: React (^17.0.2) + Ink (^3.2.0) - 现代终端 UI 框架
- **CLI**: Commander.js (^14.0.0) - 命令行参数解析
- **数据库**: MySQL2 (^3.11.0) - Promise-based MySQL 驱动
- **交互**: Inquirer (^8.2.6) - 交互式命令行界面
- **样式**: Chalk (4.1.2) - 终端颜色输出
- **配置**: dotenv (^16.0.1) - 环境变量管理
- **测试**: Jest (^30.0.2) - 测试框架
- **编译**: Babel - 支持 React/JSX 编译

### 项目结构
```
dbshift/
├── bin/
│   └── dbshift.js                    # 主入口（双模式路由）
├── lib/
│   ├── cli/
│   │   └── CLIRunner.js              # CLI 模式命令路由器
│   ├── commands/                     # 命令处理器
│   │   ├── config/                   # 配置管理命令组
│   │   │   ├── index.js              # 显示配置
│   │   │   ├── init.js               # 交互式配置初始化
│   │   │   └── set.js                # 命令行配置设置
│   │   ├── create.js                 # 创建迁移文件
│   │   ├── history.js                # 历史记录查看
│   │   ├── init.js                   # 项目初始化
│   │   ├── migrate.js                # 执行迁移
│   │   ├── status.js                 # 迁移状态检查
│   │   └── test-connection.js        # 数据库连接测试
│   ├── core/                         # 核心功能模块
│   │   ├── config.js                 # 配置管理
│   │   ├── database.js               # 数据库连接和 SQL 执行
│   │   └── migration.js              # 迁移文件管理和执行逻辑
│   ├── templates/                    # 模板文件
│   │   ├── migration.sql             # 迁移文件模板
│   │   └── schema.config.js          # 配置文件模板
│   ├── ui/                           # 交互模式 UI 组件
│   │   ├── InteractiveApp.js         # 主交互应用（React + Ink）
│   │   ├── components/               # React 组件
│   │   │   ├── Layout.js             # 布局组件
│   │   │   └── dialogs/              # 对话框组件
│   │   │       ├── ConfigDialog.js
│   │   │       ├── ConfigInitDialog.js
│   │   │       ├── ConfigSetDialog.js
│   │   │       ├── CreateDialog.js
│   │   │       └── InitDialog.js
│   │   ├── hooks/                    # React Hooks
│   │   │   ├── useCommandHistory.js
│   │   │   └── useProjectStatus.js
│   │   └── utils/
│   │       └── CommandProcessor.js
│   └── utils/                        # 工具类
│       ├── connectionTester.js       # 数据库连接测试
│       ├── errorHandler.js           # 统一错误处理
│       ├── errors.js                 # 自定义错误类
│       ├── fileUtils.js              # 文件操作和序号生成
│       ├── logger.js                 # 彩色日志输出
│       ├── progress.js               # 进度指示器
│       └── validator.js              # 输入验证
```

## 核心架构设计

### 双模式架构

#### 交互模式 (`bin/dbshift.js`)
```javascript
// 主交互应用 - 基于 React + Ink
class DBShiftApp extends React.Component {
  // 核心状态管理
  - 命令历史记录（会话级别）
  - 实时命令建议和过滤
  - 对话框状态管理
  - 键盘事件处理（箭头键、Tab、Esc）
  
  // 主要功能
  showCommandSelector()     // 即时命令选择器
  handleInput(input)        // 用户输入处理
  executeCommand(command)   // 命令执行路由
  updateSuggestions()       // 实时建议更新
}
```

**特性**:
- **即时自动补全**: 输入"/"立即显示所有命令，支持智能过滤
- **Tab 自动补全**: readline completer 函数提供真正的 Tab 补全体验
- **会话持久性**: 所有命令执行后保持交互状态，不会退出
- **对话框交互**: 复杂命令（如 create、config）使用对话框引导
- **键盘导航**: 支持箭头键历史记录导航和建议列表导航

#### CLI 模式 (`lib/cli/CLIRunner.js`)
```javascript
// CLI 命令路由器
function executeCommandLine(commandLine) {
  // 解析命令和参数
  // 路由到对应的命令处理器
  // 统一错误处理
}
```

**特性**:
- **传统 CLI 界面**: 适合脚本和自动化
- **参数解析**: 支持长参数 (--author=john) 和短参数 (-a john)
- **批处理友好**: 可在 CI/CD 中使用

### 配置管理系统

#### 多格式支持
1. **schema.config.js** - 高级配置，支持多环境
```javascript
module.exports = {
  development: { host: 'localhost', port: 3306, user: 'root', password: 'dev' },
  staging: { host: 'staging-host', port: 3306, user: 'root', password: 'staging' },
  production: { host: 'prod-host', port: 3306, user: 'root', password: 'prod' }
};
```

2. **.env** - 简单配置
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
```

#### 配置加载优先级
1. `schema.config.js` - 优先加载，支持多环境
2. `.env` - 回退选项，简单配置
3. 环境变量 - 生产环境覆盖

### 迁移文件管理

#### 文件命名规范
```
YYYYMMDDNN_Author_description.sql
```

**示例**:
- `20250711001_Greddy_create_users_table.sql`
- `20250711002_Greddy_add_email_index.sql`
- `20250711001_Jerry_create_posts_table.sql` (不同作者可使用相同序号)

#### 作者分组序号机制
**解决的问题**: 传统的全局序号在多人协作时容易产生冲突

**新的解决方案**: 每个作者独立的序号系统
```javascript
// FileUtils.generateSequence(dir, date, author)
// 1. 按日期和作者过滤文件
// 2. 查找该作者当天的最大序号
// 3. 返回 max + 1
```

**优势**:
- ✅ 消除团队协作中的序号冲突
- ✅ Git merge 更加顺畅
- ✅ 清晰的作者责任划分
- ✅ 向后兼容现有文件

### 历史记录功能

#### 会话级别历史记录
```javascript
// 每次启动时清空历史记录，开始全新会话
const loadHistory = () => {
  // 清空 .dbshift_history 文件
  // 返回空数组，开始新会话
};

// 会话内累积，保持完整顺序（包括重复命令）
const saveHistory = (newHistory) => {
  // 不去重，保持输入顺序
  // 只限制大小到 MAX_HISTORY_SIZE
};
```

**特性**:
- **会话独立**: 每次启动都是干净的历史记录会话
- **完整累积**: 会话内所有命令都保留，包括重复命令
- **箭头键导航**: 支持 ↑↓ 箭头键浏览历史记录
- **智能优先级**: 历史记录导航优先于建议列表导航

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

#### 失败重试机制
- 使用 `(version, author)` 唯一约束防止重复记录
- 执行失败时记录保持 `status=0`，可重新执行
- 重新执行时更新 `modify_date` 和重置状态

## 开发指南

### 本地开发测试
```bash
# 交互模式测试
node bin/dbshift.js

# CLI 模式测试
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
npm link                    # 本地链接到全局
dbshift                     # 测试交互模式
dbshift -p -- status       # 测试 CLI 模式
npm unlink -g dbshift      # 取消链接
```

### 关键开发要点

#### 1. 交互模式开发
- **环境变量标识**: 使用 `DBSHIFT_INTERACTIVE_MODE=true` 区分交互和 CLI 模式
- **错误处理**: 交互模式中 throw error，CLI 模式中 process.exit()
- **状态管理**: 使用 React hooks 管理复杂状态
- **事件处理**: useInput hook 处理键盘事件

#### 2. 命令处理器开发
```javascript
// 统一错误处理模式
async function commandHandler(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    try {
      // 命令逻辑
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new DatabaseError('Database connection failed', error);
      }
      throw error;
    }
  });
}
```

#### 3. 配置管理开发
- **多环境支持**: 通过 `-e` 参数指定环境
- **配置验证**: 使用 Validator.js 验证配置完整性
- **连接测试**: ConnectionTester.js 提供统一的连接测试逻辑

#### 4. 文件操作开发
```javascript
// 文件名清理规则
const sanitizedName = name
  .toLowerCase()
  .replace(/[^a-zA-Z0-9\-]/g, '_')  // 保留连字符，其他转下划线
  .replace(/_{2,}/g, '_')           // 多个连续下划线合并为一个
  .replace(/^_+|_+$/g, '');         // 移除开头和结尾的下划线
```

## 用户使用指南

### 交互模式使用
```bash
# 启动交互模式
dbshift

# 交互式命令
/                          # 显示所有可用命令
/init                      # 项目初始化（对话框引导）
/create                    # 创建迁移（对话框引导）
/migrate                   # 执行待处理的迁移
/status                    # 查看迁移状态
/history                   # 查看迁移执行历史
/history --author=John     # 按作者过滤历史
/config                    # 配置管理（对话框选择环境）
/config-init               # 交互式配置初始化
/config-set                # 配置编辑器
/ping                      # 测试数据库连接
/about                     # 显示版本信息
/help                      # 显示帮助信息
q                          # 退出交互模式
```

**交互技巧**:
- **即时补全**: 输入 "/" 立即显示所有命令
- **智能过滤**: 输入 "/i" 自动过滤到 "/init" 等相关命令
- **Tab 补全**: 按 Tab 键自动补全命令
- **历史导航**: 在空输入框按 ↑↓ 箭头键浏览历史命令
- **建议切换**: 有建议时按 Esc 关闭建议，然后可用箭头键浏览历史

### CLI 模式使用
```bash
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
dbshift -p -- config -e production
dbshift -p -- config-init
dbshift -p -- config-set --host=localhost --user=root --password=123456
dbshift -p -- config-set --host=prod-host -e production

# 连接测试
dbshift -p -- ping
dbshift -p -- ping -e production
dbshift -p -- ping --host=localhost --user=root --password=123456
```

## 测试和调试

### 测试框架
- **单元测试**: Jest 框架，`test/` 目录
- **模拟测试**: Database 类 Mock，避免真实数据库依赖
- **集成测试**: 完整的命令执行流程测试

### 调试工具
- **历史记录测试**: `test-history-*.js` 脚本
- **连接测试**: `test-connection-*.js` 脚本
- **交互模式调试**: React DevTools（通过 Ink）

### 错误处理
- **统一异常**: 使用自定义 Error 类 (DatabaseError, ValidationError, etc.)
- **错误恢复**: 交互模式下错误后自动恢复到命令提示符
- **日志输出**: Chalk 彩色日志，区分信息、警告、错误

## SQL 文件编写规范

### 文件结构
```sql
-- 迁移描述：创建用户表
-- 作者：Greddy
-- 日期：2025-07-11

-- 向前迁移
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 插入初始数据（可选）
INSERT INTO users (username, email) VALUES 
('admin', 'admin@example.com'),
('test', 'test@example.com');
```

### 编写注意事项
1. 使用标准 SQL 语法，以分号 (`;`) 分隔语句
2. 文件可在任何 SQL 编辑器中直接执行
3. 支持单行注释 (`--`) 和多行注释 (`/* */`)
4. 每个迁移文件应该是幂等的，可以安全重复执行
5. 使用模板系统生成标准化的迁移文件

## 环境配置

### 开发环境
```javascript
// schema.config.js
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'dev_password',
    database: 'myapp_development'
  }
};
```

### 生产环境
```javascript
// schema.config.js
module.exports = {
  production: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'myapp_production'
  }
};
```

## 最佳实践

### 团队协作
1. **作者标识**: 每个开发者使用唯一的作者名
2. **序号独立**: 利用作者分组序号机制避免冲突
3. **分支策略**: 迁移文件随代码一起管理
4. **环境隔离**: 使用不同环境进行开发和测试

### 迁移设计
1. **小步迁移**: 每个迁移文件只做一件事
2. **向前兼容**: 考虑线上数据的影响
3. **测试验证**: 在测试环境充分验证后部署
4. **回滚计划**: 准备数据回滚方案（如需要）

### 性能优化
1. **批量操作**: 大数据量更新使用批量操作
2. **索引策略**: 先删除索引，数据导入后重建
3. **分批执行**: 超大表修改考虑分批执行
4. **监控观察**: 执行过程中监控数据库性能

## 扩展开发

### 添加新命令
1. 在 `lib/commands/` 创建命令处理器
2. 在 `lib/ui/InteractiveApp.js` 添加交互模式支持
3. 在 `lib/cli/CLIRunner.js` 添加 CLI 模式支持
4. 更新命令列表和帮助信息

### 自定义错误处理
```javascript
// lib/utils/errors.js
class CustomError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'CustomError';
    this.originalError = originalError;
  }
}
```

### 扩展配置格式
1. 在 `lib/core/config.js` 添加新格式支持
2. 更新配置加载优先级
3. 添加相应的验证逻辑

---

这份文档提供了 DBShift 项目的完整架构和开发指南。项目采用现代化的技术栈，提供了创新的双模式用户体验，同时保持了传统 CLI 工具的强大功能。
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBShift 是一个现代化的 MySQL 数据库迁移工具，灵感来自 Flyway。它提供了简单易用的 CLI 界面，用于数据库版本控制和自动化迁移。项目采用 Node.js + MySQL2 技术栈，设计为全局 npm 包。

### 版本历史
- **v0.3.1**: 修复交互模式命令执行后退出的重大bug，完善错误处理机制
- **v0.3.0**: 实现交互模式 Tab 自动补全功能，提供类似 Claude Code 的用户体验
- **v0.2.4**: 添加交互模式支持，双模式架构设计（交互模式 + CLI模式）
- **v0.2.3**: 添加 ping 命令用于数据库连接测试，重构连接测试逻辑
- **v0.2.1+**: 引入作者分组序号机制，解决多人协作冲突
- **v0.2.0**: 添加配置管理命令（config, config-init, config-set）
- **v0.1.x**: 基础迁移功能和CLI架构

### 核心特性
- 🎯 **Tab 自动补全**: readline completer 函数提供真正的 Tab 补全体验，支持命令过滤和描述显示
- 🔄 **交互模式持久性**: 命令执行后保持会话活跃，使用环境变量控制 process.exit() 行为
- 🔢 **作者分组序号**: 每个开发者独立的序号系统，避免团队协作冲突
- ⚙️ **灵活配置管理**: 支持 .env 和 schema.config.js 两种配置方式
- 🖥️ **双模式架构**: 交互模式（dbshift）+ CLI模式（dbshiftcli），满足不同使用场景
- 🏓 **连接测试**: ping 命令快速测试数据库连接，支持临时参数和多环境
- 🔄 **失败重试机制**: 基于唯一约束的安全重试系统
- 🌍 **多环境支持**: development, staging, production 环境隔离
- 📝 **标准SQL兼容**: 支持任意SQL编辑器执行的标准语法
- 🚀 **自动化CI/CD**: GitHub Actions 双源发布到 NPM 和 GitHub Packages

## 核心架构

### CLI 工具结构
- `bin/dbshift.js`: 交互模式入口文件，提供友好的交互界面（v0.2.4+）
- `bin/dbshiftcli.js`: CLI 模式入口文件，处理命令行参数和子命令路由
- `lib/commands/`: 各个命令的实现
  - `init.js`: 项目初始化，创建目录和配置文件
  - `migrate.js`: 执行待处理的迁移文件
  - `status.js`: 查看迁移状态和历史
  - `create.js`: 创建新的迁移文件（支持作者分组序号）
  - `test-connection.js`: ping 命令实现，支持连接测试
  - `config/`: 配置管理命令组
    - `index.js`: 显示当前配置
    - `init.js`: 交互式配置向导
    - `set.js`: 命令行直接设置配置
- `lib/core/`: 核心功能模块
  - `database.js`: 数据库连接和SQL执行
  - `config.js`: 配置文件加载和验证
  - `migration.js`: 迁移文件管理和执行逻辑
- `lib/utils/`: 工具类
  - `fileUtils.js`: 文件操作和序号生成（包含作者分组逻辑）
  - `connectionTester.js`: 数据库连接测试工具类（v0.2.3+）
  - `logger.js`: 彩色日志输出
  - `validator.js`: 输入验证
- `package.json`: NPM 包配置，bin 字段指向 `dbshift` 全局命令

### 迁移文件命名规范
SQL 迁移文件遵循严格的命名规范：`YYYYMMDDNN_Author_description.sql`
- `YYYYMMDDNN`: 版本号（年月日+序号）
- `Author`: 作者名（如 Admin, greddy, jerry 等）
- `description`: 功能描述

### 🔢 作者分组序号机制 (v0.2.1+)
**解决的问题**: 传统的全局序号在多人协作时容易产生冲突
- Alice 创建: `20250621001_Alice_xxx.sql`
- Bob 创建: `20250621002_Bob_xxx.sql`
- Alice 再创建时无法使用 003，因为已被占用

**新的解决方案**: 每个作者独立的序号系统
```bash
# 同一天不同作者可以使用相同序号
20250621001_Alice_create_users.sql    # Alice的第1个
20250621001_Bob_create_posts.sql      # Bob的第1个（无冲突）
20250621002_Alice_add_index.sql       # Alice的第2个
20250621002_Bob_add_comments.sql      # Bob的第2个（无冲突）
```

**实现原理**:
- `FileUtils.generateSequence(dir, date, author)` 按作者过滤文件
- 查找该作者当天的最大序号，返回 max + 1
- 保证同一作者的序号连续，不同作者的序号独立

**优势**:
- ✅ 消除团队协作中的序号冲突
- ✅ Git merge 更加顺畅
- ✅ 清晰的作者责任划分
- ✅ 向后兼容现有文件

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
node bin/dbshift.js --help
node bin/dbshift.js init
node bin/dbshift.js create "test_migration" --author="developer"
node bin/dbshift.js migrate
node bin/dbshift.js status
node bin/dbshift.js config
```

### 全局安装测试
```bash
npm link                    # 本地链接到全局
dbshift --help             # 测试全局命令
dbshift init               # 测试项目初始化
npm unlink -g dbshift      # 取消链接
```

### 作者分组序号测试
```bash
# 测试不同作者独立序号
node bin/dbshift.js create "feature1" --author="alice"   # 应该生成 001
node bin/dbshift.js create "feature2" --author="bob"     # 应该生成 001
node bin/dbshift.js create "feature3" --author="alice"   # 应该生成 002
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

### 迁移文件命名规则

**文件格式**: `YYYYMMDDNN_Author_description.sql`

**v0.2.1+ 按作者分组序号优化**:
- 解决多人协作时的序号冲突问题
- 每个作者有独立的序号流水线
- 例如：Alice的文件: 01, 02, 03...，Bob的文件: 01, 02, 03...
- 避免团队开发时的merge conflicts

**序号生成逻辑**:
```javascript
// FileUtils.generateSequence(dirPath, dateStr, author)
// 1. 筛选同日期同作者的文件
// 2. 找出该作者的最大序号
// 3. 返回 max + 1
```

### 开发时常用命令
```bash
# 测试交互模式 (v0.2.4+)
node bin/dbshift.js                    # 进入交互模式

# 测试 CLI 功能
node bin/dbshiftcli.js init
node bin/dbshiftcli.js create test_migration
node bin/dbshiftcli.js migrate
node bin/dbshiftcli.js status

# 配置管理测试
node bin/dbshiftcli.js config
node bin/dbshiftcli.js config-init
node bin/dbshiftcli.js config-set --host=testhost --user=testuser

# 连接测试 (v0.2.3+)
node bin/dbshiftcli.js ping
node bin/dbshiftcli.js ping --host=localhost --user=root
```

### 用户使用命令
```bash
# 全局安装后
npm install -g dbshift

# 交互模式 (v0.2.4+) - 推荐新用户使用
dbshift                           # 进入交互模式
# 然后在交互模式中使用:
# /init, /migrate, /status, /create, /config, /ping

# CLI 模式 - 适合脚本和自动化
dbshiftcli init
dbshiftcli create create_users_table
dbshiftcli migrate
dbshiftcli status

# 配置管理命令 (v0.2.0+)
dbshiftcli config                 # 显示当前配置
dbshiftcli config-init            # 交互式配置设置
dbshiftcli config-set --host=localhost --user=root --password=123456

# 连接测试命令 (v0.2.3+)
dbshiftcli ping                   # 测试当前配置连接
dbshiftcli ping -e production     # 测试生产环境连接
dbshiftcli ping --host=localhost --user=root --password=123456  # 临时测试连接
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

1. 使用标准 SQL 语法，以分号 (`;`) 分隔语句
2. 文件可在任何 SQL 编辑器中直接执行
3. 自动过滤注释和空语句
4. 每个迁移文件应该是幂等的，可以安全重复执行
5. 使用模板系统生成标准化的迁移文件
6. 支持单行注释 (`--`) 和多行注释 (`/* */`)

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
- **测试**: Jest 测试框架
- **CI/CD**: GitHub Actions 自动化
- **Node**: >= 14.0.0

## CI/CD 架构

### GitHub Actions 工作流

#### 🧪 测试工作流 (.github/workflows/test.yml)
- **触发条件**: push 到 main/develop 分支，或 Pull Request
- **测试矩阵**: Node.js 16, 18, 20 版本
- **测试步骤**:
  1. 单元测试 (Jest)
  2. 代码质量检查
  3. 安全审计 (npm audit)
  4. 覆盖率报告 (Codecov)

#### 🚀 发布工作流 (.github/workflows/publish.yml)
- **触发条件**: 推送 `v*` 格式的 git 标签 (例如: v0.3.0)
- **发布步骤**:
  1. 运行完整测试套件
  2. 发布到 NPM Registry (公共)
  3. 发布到 GitHub Packages (@greddy7574/dbshift)
  4. 创建 GitHub Release (包含详细的 release notes)

### 自动化流程
- **质量保证**: 所有 PR 必须通过测试
- **版本管理**: 通过 git 标签触发自动发布
- **双仓库发布**: NPM + GitHub Packages 并行发布
- **发布文档**: 自动生成详细的 release notes

## 最新开发指导 (v0.3.0+)

### 自动补全功能实现 (v0.3.0)

#### 设计理念
- **用户体验至上**: 输入 "/" 立即显示可选命令，降低学习成本
- **上下文敏感**: 根据当前菜单上下文显示相关命令
- **引导式操作**: 复杂命令（如 create）提供分步引导
- **持续交互**: 命令执行后保持在交互模式，提供真正的持续会话体验
- **优雅降级**: 保持传统文本菜单作为备选方案

#### v0.3.0 关键修复
**问题1: 自动补全功能访问**
- **现象**: 用户输入 "/" 后没有显示命令选择器
- **原因**: 功能实际工作正常，但用户测试方式不正确
- **解决**: 改善文档说明和用户引导

**问题2: 交互模式持续性**
- **现象**: 执行任何命令后会退出交互模式
- **根本原因**: 命令模块中的 `process.exit(1)` 调用终止整个进程
- **解决方案**: 
  - 引入 `DBSHIFT_INTERACTIVE_MODE` 环境变量
  - 修改所有命令模块支持交互模式
  - 实现智能错误处理，在交互模式下抛出异常而非退出进程

#### 技术实现架构
```javascript
// 自动补全核心组件
showCommandSelector() {
  // 1. 暂停当前 readline 接口
  this.rl.pause();
  
  // 2. 根据上下文生成命令选项
  const choices = this.generateChoicesForContext();
  
  // 3. 使用 inquirer 显示选择界面
  const { command } = await inquirer.prompt([{
    type: 'list',
    name: 'command',
    message: 'Select a command:',
    choices: choices,
    pageSize: 10
  }]);
  
  // 4. 恢复 readline 接口
  this.rl.resume();
  
  // 5. 处理选择的命令
  await this.handleSelectedCommand(command);
}
```

#### 命令分类设计
```javascript
// 主菜单命令
const mainMenuChoices = [
  { name: '🚀 Initialize new project', value: '/init' },
  { name: '📦 Run pending migrations', value: '/migrate' },
  { name: '📊 Show migration status', value: '/status' },
  { name: '📝 Create new migration', value: '/create', needsInput: true },
  { name: '⚙️ Configuration management', value: '/config' },
  { name: '🏓 Test database connection', value: '/ping' },
  { name: '🧹 Clear screen', value: '/clear' },
  { name: '❓ Show help', value: '/help' },
  { name: '❌ Cancel', value: 'cancel' }
];

// 配置子菜单命令
const configMenuChoices = [
  { name: '📋 Show current configuration', value: '/config show' },
  { name: '⚙️ Interactive configuration setup', value: '/config init' },
  { name: '🔧 Set configuration values', value: '/config set' },
  { name: '🔙 Back to main menu', value: '/back' },
  { name: '❌ Cancel', value: 'cancel' }
];
```

#### 复杂命令处理模式
```javascript
// 需要额外输入的命令处理
async handleCreateCommand() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'migrationName',
      message: 'Enter migration name:',
      validate: (input) => {
        if (!input.trim()) return 'Migration name cannot be empty';
        if (!/^[a-zA-Z0-9_]+$/.test(input.trim())) {
          return 'Migration name can only contain letters, numbers, and underscores';
        }
        return true;
      }
    },
    {
      type: 'input', 
      name: 'author',
      message: 'Enter author name (optional):',
      default: 'Admin'
    }
  ]);
  
  const command = `/create ${answers.migrationName} --author=${answers.author}`;
  await this.handleInput(command);
}
```

#### 界面状态管理
```javascript
// readline 接口生命周期管理
1. 正常状态: readline 监听用户输入
2. 选择状态: pause() -> inquirer 接管 -> resume()
3. 错误恢复: catch 块中确保 resume() 被调用
4. 优雅退出: 用户选择 Cancel 或按 Ctrl+C

// 上下文切换
- currentContext = 'main'   → 显示主菜单命令
- currentContext = 'config' → 显示配置命令
```

#### 用户体验优化
- **视觉层次**: 使用表情符号和颜色区分命令类型
- **搜索友好**: inquirer 支持上下箭头键和首字母快速选择
- **取消机制**: 随时可以取消操作，回到命令提示符
- **错误处理**: 输入验证和友好的错误提示

#### Tab 自动补全功能 (v0.3.0+)

**實現類似 Claude Code 的補全體驗**:

**readline completer 函數**:
```javascript
completer(line) {
  const currentCommands = this.currentContext === 'config' 
    ? this.commands.config 
    : this.commands.main;
  
  const completions = currentCommands.map(cmd => cmd.command);
  
  // 命令過濾和補全
  if (line.startsWith('/')) {
    const hits = completions.filter(c => c.startsWith(line));
    
    // 多個匹配時顯示詳細信息
    if (hits.length > 1) {
      console.log('\n📋 Available Commands:');
      hits.forEach(hit => {
        const cmdInfo = currentCommands.find(c => c.command === hit);
        console.log(`  ${hit.padEnd(15)} ${cmdInfo.description}`);
      });
    }
    
    return [hits, line];
  }
  
  return [[], line];
}
```

**使用方法**:
1. **輸入 "/" 然後按 Tab** - 顯示所有命令和描述
2. **輸入部分命令（如 "/m"）+ Tab** - 顯示匹配的命令
3. **空白處按 Tab** - 提示使用斜槓命令

**上下文感知**:
- **main 模式**: `/init`, `/migrate`, `/status`, `/create`, `/config`, `/ping`, `/help`, `/clear`, `q`
- **config 模式**: `/config show`, `/config init`, `/config set`, `/back`

#### 交互模式錯誤處理機制 (v0.3.1 修復)

**核心問題解決**:
交互模式 v0.3.0 版本存在命令執行後退出的嚴重 bug，v0.3.1 通過以下機制彻底解決：

**环境变量标识系统**:
```javascript
// 交互模式启动时设置环境标识
process.env.DBSHIFT_INTERACTIVE_MODE = 'true';
```

**智能错误处理策略**:
```javascript
// 命令模块中的条件退出逻辑
catch (error) {
  console.error('Command failed:', error.message);
  if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
    process.exit(1);  // CLI 模式：退出进程
  } else {
    throw error;      // 交互模式：抛出错误供上层处理
  }
}
```

**交互模式统一错误捕获**:
```javascript
// routeCommand 中为每个命令添加 try-catch
case '/init':
  try {
    await initCommand();
    console.log(chalk.green('✅ Project initialized successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize project:'), error.message);
  }
  break; // 继续保持在交互模式
```

**v0.3.1 修復的關鍵文件**:
- `lib/utils/errorHandler.js` - **核心修復**: executeWithErrorHandling 不再在成功時調用 process.exit(0)
- `lib/commands/status.js` - 狀態檢查命令錯誤處理
- `lib/commands/config/index.js` - 配置顯示命令錯誤處理  
- `lib/commands/config/init.js` - 配置初始化錯誤處理
- `lib/commands/config/set.js` - 配置設置錯誤處理
- `lib/commands/init.js` - 項目初始化錯誤處理
- `lib/commands/create.js` - 遷移創建錯誤處理
- `lib/commands/test-connection.js` - 連接測試錯誤處理

**ErrorHandler 核心修復**:
```javascript
static async executeWithErrorHandling(fn) {
  try {
    await fn();
    // v0.3.1 修復：在交互模式下不退出進程
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(0);
    }
  } catch (error) {
    const exitCode = this.handle(error);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(exitCode);
    } else {
      throw error; // 抛出错误供交互模式处理
    }
  }
}
```

**优势**:
- ✅ 错误后自动恢复到命令提示符
- ✅ 保持用户会话连续性
- ✅ 提供清晰的错误反馈
- ✅ 不影响 CLI 模式的原有行为

### 交互模式架构 (v0.2.4)

#### 双模式设计理念
- **用户友好**: 交互模式降低新用户学习成本，类似 Claude Code 的体验
- **脚本兼容**: CLI 模式保持向后兼容，适合自动化和 CI/CD
- **代码复用**: 两种模式共享相同的命令逻辑，避免重复实现

#### 交互模式架构 (`bin/dbshift.js`)
```javascript
class DBShiftInteractive {
  // 核心组件
  - readline接口管理
  - 上下文状态管理 (main/config)
  - 命令路由和参数解析
  - 菜单系统和用户界面
  
  // 主要方法
  showWelcome()           // 显示欢迎界面
  showMainMenu()          // 显示主菜单
  showConfigMenu()        // 显示配置子菜单
  handleInput(input)      // 处理用户输入
  routeCommand(cmd, args) // 路由命令到对应处理器
}
```

#### 命令系统设计
```javascript
// 交互模式命令映射
'/init'     → initCommand()
'/migrate'  → migrateCommand(options)  
'/status'   → statusCommand(options)
'/create'   → createCommand(name, options)
'/config'   → 进入配置子菜单
'/ping'     → testConnectionCommand(options)

// 参数解析支持
parseEnvFromArgs()      // 解析 -e/--env 参数
parseAuthorFromArgs()   // 解析 --author 参数  
parsePingOptions()      // 解析连接测试参数
```

#### 用户体验设计
- **直观菜单**: `/` 命令显示可用功能
- **上下文切换**: `/config` 进入子菜单，`/back` 返回
- **实用功能**: `/clear` 清屏，`q` 退出
- **错误处理**: 友好的错误提示和恢复
- **彩色输出**: 使用 chalk 提供视觉反馈

### 连接测试重构 (v0.2.3)

#### ping 命令设计理念
- **命令简洁**: 使用 `ping` 替代 `test-connection`，避免与未来其他测试功能冲突
- **功能独立**: 专门用于数据库连接测试，语义明确
- **参数灵活**: 支持配置文件和临时参数两种测试方式

#### ConnectionTester 工具类 (`lib/utils/connectionTester.js`)
```javascript
// 核心功能
- testConnection(dbConfig, options)    // 主要连接测试方法
- testMigrationTableAccess(dbConfig)   // 迁移表访问测试
- showTroubleshootingSuggestions(error) // 故障排除建议

// 使用示例
const result = await ConnectionTester.testConnection(dbConfig, {
  verbose: true,              // 显示详细信息
  testMigrationTable: true    // 测试迁移表访问
});
```

#### 代码重构要点
1. **DRY原则**: 提取重复的连接测试代码到 ConnectionTester 类
2. **复用性**: config 命令和 ping 命令共享相同的连接测试逻辑
3. **扩展性**: ConnectionTester 支持多种测试选项和详细的错误处理

#### 测试覆盖
- `test/utils/connectionTester.test.js`: 31个测试用例
- 测试成功连接、连接失败、迁移表访问等场景
- Mock Database 类确保测试的独立性

### 作者序号功能开发要点
1. **核心逻辑**: `FileUtils.generateSequence()` 方法
   - 按日期和作者过滤文件
   - 使用 `versionPart.substring(versionPart.length - 2)` 提取序号
   - 返回该作者的最大序号 + 1

2. **测试覆盖**: `test/utils/fileUtils.sequence.test.js`
   - 新作者从01开始
   - 不同作者独立序号
   - 不同日期独立计算
   - 处理最大序号99
   - 忽略格式错误的文件

3. **向后兼容**: 现有文件命名不受影响，新功能只在创建新文件时生效

### SQL文件处理简化 (v0.2.1+)
- **移除复杂解析**: 不再处理 DELIMITER 和特殊分隔符
- **标准SQL兼容**: 使用标准分号分隔，支持任意SQL编辑器
- **注释处理**: 自动移除单行注释(`--`)和多行注释(`/* */`)

### 文档维护策略
- **CLAUDE.md**: Claude开发指导，包含架构和实现细节
- **README.md**: 用户使用指南，重点在功能和使用方法
- **docs/API.md**: 详细的API规格和代码示例
- **docs/CI-CD.md**: CI/CD流程和操作指南
- **docs/DESIGN.md**: 设计决策和架构思考

### 开发流程最佳实践
1. **功能开发**: 先写测试，再实现功能
2. **文档更新**: 每个功能完成后立即更新相关文档
3. **版本发布**: 使用语义化版本控制，通过git标签触发CI/CD
4. **团队协作**: 利用作者分组序号机制避免冲突

### 未来规划
- [ ] PostgreSQL 支持
- [ ] 迁移回滚功能  
- [ ] 干运行模式(dry-run)
- [ ] 更多数据库支持
- [ ] Web UI 管理界面
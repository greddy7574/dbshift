# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBShift 是一个现代化的 MySQL 数据库迁移工具，灵感来自 Flyway。它提供了简单易用的 CLI 界面，用于数据库版本控制和自动化迁移。项目采用 Node.js + MySQL2 技术栈，设计为全局 npm 包。

### 版本历史
- **v0.2.3**: 添加 ping 命令用于数据库连接测试，重构连接测试逻辑
- **v0.2.1+**: 引入作者分组序号机制，解决多人协作冲突
- **v0.2.0**: 添加配置管理命令（config, config-init, config-set）
- **v0.1.x**: 基础迁移功能和CLI架构

### 核心特性
- 🔢 **作者分组序号**: 每个开发者独立的序号系统，避免团队协作冲突
- ⚙️ **灵活配置管理**: 支持 .env 和 schema.config.js 两种配置方式
- 🏓 **连接测试**: ping 命令快速测试数据库连接，支持临时参数和多环境
- 🔄 **失败重试机制**: 基于唯一约束的安全重试系统
- 🌍 **多环境支持**: development, staging, production 环境隔离
- 📝 **标准SQL兼容**: 支持任意SQL编辑器执行的标准语法
- 🚀 **自动化CI/CD**: GitHub Actions 双源发布到 NPM 和 GitHub Packages

## 核心架构

### CLI 工具结构
- `bin/dbshift.js`: CLI 入口文件，处理命令行参数和子命令路由
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
# 测试 CLI 功能
node bin/dbshift.js init
node bin/dbshift.js create test_migration
node bin/dbshift.js migrate
node bin/dbshift.js status

# 配置管理测试
node bin/dbshift.js config
node bin/dbshift.js config-init
node bin/dbshift.js config-set --host=testhost --user=testuser

# 连接测试 (v0.2.3+)
node bin/dbshift.js ping
node bin/dbshift.js ping --host=localhost --user=root
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

# 连接测试命令 (v0.2.3+)
dbshift ping                      # 测试当前配置连接
dbshift ping -e production        # 测试生产环境连接
dbshift ping --host=localhost --user=root --password=123456  # 临时测试连接
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

## 最新开发指导 (v0.2.1+)

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
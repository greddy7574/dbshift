# DBShift Design Document

## 概览

本文档记录了 DBShift 项目的关键设计决策、架构选择和技术考量。DBShift 是一个现代化的 MySQL 数据库迁移工具，旨在为团队提供简单、可靠的数据库版本控制解决方案。

## 设计目标

### 主要目标
1. **简单易用**: 一条命令完成初始化，直观的CLI界面
2. **团队友好**: 解决多人协作中的序号冲突问题
3. **标准兼容**: SQL文件可在任何编辑器中执行
4. **生产就绪**: 可靠的错误处理和重试机制
5. **开发者体验**: 清晰的反馈和详细的错误信息

### 非目标
- 不追求多数据库支持（专注MySQL）
- 不提供图形界面（专注CLI体验）
- 不实现复杂的回滚机制（优先前进式迁移）

## 核心设计决策

### 1. 作者分组序号机制 (v0.2.1+)

#### 问题背景
传统的全局序号系统在团队协作中会产生冲突：
```
Alice: 20250621001_Alice_create_users.sql
Bob:   20250621002_Bob_create_posts.sql  
Alice: ❌ 无法创建 20250621003_Alice_xxx.sql (已被占用)
```

#### 设计决策
**每个作者维护独立的序号流水线**

```
Alice: 20250621001_Alice_create_users.sql   (Alice 序号 01)
Bob:   20250621001_Bob_create_posts.sql     (Bob 序号 01, 无冲突)
Alice: 20250621002_Alice_add_index.sql      (Alice 序号 02)
Bob:   20250621002_Bob_add_comments.sql     (Bob 序号 02, 无冲突)
```

#### 技术实现
```javascript
FileUtils.generateSequence(dirPath, dateStr, author)
// 1. 按日期前缀过滤文件
// 2. 按作者名过滤文件  
// 3. 找到该作者的最大序号
// 4. 返回 max + 1
```

#### 优势分析
- ✅ **消除冲突**: 不同作者可以并行开发
- ✅ **Git友好**: merge操作不会产生序号冲突
- ✅ **清晰责任**: 文件名明确标识作者
- ✅ **向后兼容**: 现有文件命名不受影响

#### 替代方案考虑
1. **UUID方案**: 过于复杂，失去顺序性
2. **时间戳方案**: 精度问题，仍可能冲突
3. **分支前缀方案**: 增加复杂性，不够直观

### 2. SQL文件处理简化 (v0.2.1+)

#### 问题背景
原始设计使用复杂的SQL解析：
- 支持 `;;` 分隔符
- 处理 `DELIMITER` 指令
- 复杂的注释移除逻辑

用户反馈：SQL文件无法在标准编辑器中直接执行。

#### 设计决策
**简化为标准SQL处理**

```javascript
// 简化后的处理逻辑
const statements = content
  .split(';')                           // 标准分号分隔
  .map(stmt => stmt.trim())             
  .filter(stmt => stmt.length > 0);     

for (const statement of statements) {
  const sql = statement
    .replace(/--.*$/gm, '')             // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')   // 移除多行注释
    .trim();
  
  if (sql) await connection.query(sql);
}
```

#### 优势分析
- ✅ **通用兼容**: 文件可在 MySQL Workbench、phpMyAdmin 中执行
- ✅ **降低复杂度**: 移除了大量边缘情况处理
- ✅ **易于理解**: 开发者无需学习特殊语法
- ✅ **减少错误**: 简单逻辑降低了bug风险

### 3. 配置管理架构 (v0.2.0+)

#### 设计原则
- **多格式支持**: `.env` (简单) + `schema.config.js` (高级)
- **环境隔离**: development, staging, production
- **智能检测**: 自动选择合适的配置文件
- **向导式设置**: 交互式配置生成

#### 命令设计
```bash
dbshift config          # 查看当前配置
dbshift config-init     # 交互式配置向导
dbshift config-set      # 命令行直接设置
```

#### 配置优先级
1. 命令行参数 (`--env production`)
2. `schema.config.js` 中的环境配置
3. `.env` 文件中的环境变量
4. 默认值 (development)

### 4. 连接测试架构 (v0.2.3+)

#### 设计背景
原先的连接测试功能分散在 `config-init` 和 `config-set` 命令中，存在代码重复和功能不完整的问题。

#### 设计目标
- **命令独立**: 提供专门的连接测试命令
- **代码重用**: 统一的连接测试逻辑
- **功能完整**: 支持详细诊断和故障排除

#### 命令设计选择

**为什么选择 `ping` 而不是 `test`？**
```bash
# 如果使用 test 作为主命令，将来会有冲突：
dbshift test connection
dbshift test sql-syntax
dbshift test migration-integrity

# 使用 ping 语义更清晰，专门用于连接测试：
dbshift ping                    # 简洁、明确
dbshift validate-sql           # 其他测试功能用更具体的命令
dbshift check-migration
```

#### 架构设计
```javascript
// 重构前：分散的连接测试代码
// config/init.js 中有连接测试
// config/set.js 中有连接测试
// → 代码重复，难以维护

// 重构后：统一的连接测试架构
ConnectionTester.testConnection(dbConfig, options)
├── 基本连接测试
├── MySQL版本检测  
├── 性能计时统计
├── 迁移表访问测试 (可选)
└── 错误分类和建议
```

#### 双重测试模式
1. **配置文件测试**: `dbshift ping -e production`
2. **临时参数测试**: `dbshift ping --host=localhost --user=root`

#### 错误分类处理
```javascript
const errorTypes = {
  'ECONNREFUSED': '检查MySQL服务是否启动',
  'ER_ACCESS_DENIED_ERROR': '检查用户名密码',
  'ENOTFOUND': '检查主机名DNS解析',
  'ER_BAD_DB_ERROR': '检查数据库是否存在'
};
```

### 5. 自动补全功能架构 (v0.3.0)

#### 设计背景
v0.2.4 的交互模式虽然降低了学习成本，但用户仍需记住命令名称。参考 Claude Code 的 "/" 触发自动补全体验，进一步提升易用性。

#### 设计目标
- **零记忆负担**: 输入 "/" 即可看到所有可用命令
- **上下文智能**: 根据当前菜单状态显示相关命令
- **引导式操作**: 复杂命令提供分步骤引导
- **无缝集成**: 与现有交互模式完美融合

#### 核心创新点
```javascript
// "/" 触发机制设计
if (input === '/') {
  await this.showCommandSelector();  // 显示智能选择器
  return;
}
```

**为什么选择 "/" 作为触发器？**
- ✅ 与文件路径语义区分明确
- ✅ 用户直觉：斜杠通常表示"命令"或"目录"
- ✅ 单字符输入，操作简便
- ✅ 不与现有命令冲突

#### 自动补全系统架构

**技术实现栈**:
- `readline`: 基础输入/输出控制
- `inquirer`: 提供丰富的交互式界面
- 状态管理: pause/resume 机制确保无冲突

**核心工作流程**:
```
用户输入 "/" 
    ↓
暂停 readline 接口
    ↓
inquirer 接管，显示命令选择器
    ↓  
用户选择命令 (箭头键 + 回车)
    ↓
恢复 readline 接口
    ↓
执行选择的命令
```

**上下文敏感设计**:
```javascript
// 主菜单上下文 (currentContext = 'main')
显示: init, migrate, status, create, config, ping, clear, help

// 配置菜单上下文 (currentContext = 'config')  
显示: config show, config init, config set, back

// 动态选择生成
generateContextChoices() {
  return this.currentContext === 'config' 
    ? this.configMenuChoices 
    : this.mainMenuChoices;
}
```

**复杂命令引导模式**:
- 简单命令: 直接执行 (如 /init, /status)
- 复杂命令: 分步引导 (如 /create → 输入迁移名 → 输入作者)
- 参数验证: 实时输入验证和错误提示

### 6. 交互模式架构 (v0.2.4)

#### 设计背景
随着项目功能增多，CLI 命令数量增长，新用户学习成本上升。参考 Claude Code 的交互体验，设计双模式架构。

#### 设计目标
- **降低学习成本**: 新用户通过交互式菜单快速上手
- **保持兼容性**: 现有 CLI 用户和自动化脚本不受影响
- **统一体验**: 两种模式共享相同的核心逻辑

#### 双模式架构设计

**架构对比**：
```javascript
// v0.2.3 及之前：单一 CLI 模式
bin/dbshift.js → CLI 命令处理

// v0.2.4：双模式架构  
bin/dbshift.js    → 交互模式入口
bin/dbshiftcli.js → CLI 模式入口
```

**用户体验分层**：
```bash
# 新手友好：交互模式
dbshift                    # 进入交互界面
/init                      # 菜单引导的命令
/migrate                   
/                          # 显示帮助菜单

# 专业高效：CLI 模式  
dbshiftcli init            # 直接执行
dbshiftcli migrate -e prod # 脚本友好
```

#### 交互模式技术实现

**核心组件**：
```javascript
class DBShiftInteractive {
  constructor() {
    this.rl = readline.createInterface()  // 命令行交互
    this.currentContext = 'main'         // 上下文管理
  }
  
  // 主要功能
  showWelcome()           // 欢迎界面
  showMainMenu()          // 主菜单
  showConfigMenu()        // 配置子菜单  
  handleInput(input)      // 输入处理
  routeCommand(cmd, args) // 命令路由
}
```

**命令路由系统**：
```javascript
// 交互模式命令映射
const commandMap = {
  '/init':    () => initCommand(),
  '/migrate': (args) => migrateCommand(parseOptions(args)),
  '/config':  () => this.enterConfigContext(),
  '/ping':    (args) => testConnectionCommand(parseOptions(args))
};
```

**参数解析设计**：
```javascript
// 统一的参数解析逻辑
parseEnvFromArgs(args)    // -e production
parseAuthorFromArgs(args) // --author=john  
parsePingOptions(args)    // --host=localhost --user=root
```

#### 上下文切换机制

**状态管理**：
```javascript
// 主菜单上下文
currentContext = 'main'
showMainMenu()  // 显示所有主要命令

// 配置子菜单上下文
currentContext = 'config'  
showConfigMenu()  // 显示配置相关命令
```

**导航设计**：
- `/config` → 进入配置子菜单
- `/back` → 返回主菜单
- `/` → 显示当前上下文的帮助
- `q` → 退出交互模式

#### 用户体验优化

**视觉设计**：
```javascript
// 欢迎界面
╔══════════════════════════════════════╗
║          DBShift v0.2.4           ║  
║      Interactive Database Migration   ║
╚══════════════════════════════════════╝

// 彩色输出
chalk.blue('🔍 Testing database connection...')
chalk.green('✅ Project initialized successfully!')
chalk.yellow('⚠ Usage: /create <migration_name>')
```

**错误处理**：
- 友好的错误提示
- 自动恢复到提示符
- 建议命令和帮助信息

#### 向后兼容策略

**包管理配置**：
```json
{
  "bin": {
    "dbshift": "bin/dbshift.js",      // 新：交互模式
    "dbshiftcli": "bin/dbshiftcli.js" // 原CLI模式重命名
  }
}
```

**迁移路径**：
1. 现有用户：`dbshift` → `dbshiftcli` （功能完全一致）
2. 新用户：推荐使用 `dbshift` 交互模式
3. 自动化：继续使用 `dbshiftcli` 进行脚本集成

### 6. 错误处理和重试机制

#### 数据库设计
```sql
CREATE TABLE `dbshift`.`migration_history` (
  `version` varchar(20) NOT NULL,
  `author` varchar(20) NOT NULL,
  `status` tinyint(1) DEFAULT '0',        -- 0=待执行, 1=已完成
  `create_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `modify_date` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_version_author` (`version`, `author`)  -- 防重复约束
);
```

#### 重试逻辑
1. **首次执行**: 插入记录，status=0
2. **执行成功**: 更新 status=1
3. **执行失败**: 保持 status=0，可重新执行
4. **重新执行**: 更新 modify_date，重置状态

#### 安全保证
- 唯一约束防止重复记录
- 事务性执行保证一致性
- 详细的错误日志记录

### 5. CLI架构设计

#### 命令结构
```
bin/dbshift.js          # 入口点和路由
├── init                # 项目初始化
├── create              # 创建迁移文件
├── migrate             # 执行迁移
├── status              # 查看状态
├── config              # 配置管理
├── config-init         # 配置向导
└── config-set          # 配置设置
```

#### 模块化设计
- **commands/**: 各命令的具体实现
- **core/**: 核心业务逻辑
- **utils/**: 通用工具函数
- **templates/**: 文件模板

#### 用户体验设计
- **彩色输出**: 使用 chalk 提供清晰的视觉反馈
- **进度提示**: 详细的执行步骤说明
- **错误指导**: 具体的错误原因和解决建议
- **交互确认**: 重要操作前的用户确认

## 技术选型

### 核心依赖
- **Commander.js**: 成熟的CLI框架，良好的参数解析
- **MySQL2**: Promise-based，现代化的MySQL驱动
- **Inquirer**: 丰富的交互式命令行界面
- **Chalk**: 终端颜色输出，提升用户体验

### 开发工具
- **Jest**: 测试框架，良好的Node.js生态集成
- **GitHub Actions**: CI/CD自动化，免费且功能强大
- **npm**: 包管理和发布，最大的JavaScript生态系统

### 替代方案考虑
- **数据库ORM**: 选择原生SQL保持灵活性和透明度
- **TypeScript**: 考虑过，但为了降低复杂度选择JavaScript
- **Lerna**: 单包项目不需要monorepo管理

## 性能考虑

### 文件处理性能
- **序号生成**: O(n)时间复杂度，n为当日该作者的文件数
- **SQL解析**: 线性扫描，适合中等规模的SQL文件
- **内存使用**: 文件内容一次性加载，适合典型迁移文件大小

### 数据库性能
- **批量执行**: 逐句执行保证错误定位精确
- **连接管理**: 单连接复用，避免连接开销
- **事务控制**: 每个迁移文件一个事务

### 可扩展性
- **文件数量**: 支持数千个迁移文件
- **团队规模**: 序号机制支持任意数量的开发者
- **项目规模**: 适合中小型到大型项目

## 安全考虑

### SQL注入防护
- 使用参数化查询
- 避免动态SQL拼接
- 验证用户输入

### 配置安全
- 环境变量存储敏感信息
- 配置文件加入.gitignore
- 生产环境强制使用环境变量

### 权限控制
- 数据库权限最小化原则
- 迁移历史表的读写隔离
- CI/CD中的密钥管理

## 测试策略

### 单元测试
- **核心逻辑**: 序号生成、文件解析、配置管理
- **边缘情况**: 错误输入、文件不存在、权限问题
- **回归测试**: 确保修改不破坏现有功能

### 集成测试
- **数据库操作**: 真实MySQL环境测试
- **文件系统**: 临时目录中的文件操作
- **CLI命令**: 端到端的命令执行测试

### 测试覆盖率
- 目标：核心逻辑90%+覆盖率
- 工具：Jest内置覆盖率报告
- CI集成：发布前强制运行测试

## 文档策略

### 文档层次
1. **README.md**: 用户快速入门指南
2. **CLAUDE.md**: Claude开发指导文档
3. **docs/API.md**: 详细的API规格
4. **docs/CI-CD.md**: CI/CD流程文档
5. **docs/DESIGN.md**: 设计决策记录

### 维护策略
- 功能开发时同步更新文档
- 版本发布前检查文档一致性
- 用户反馈驱动的文档改进

## 未来规划

### 短期优化 (v0.3.x)
- PostgreSQL支持
- 迁移回滚功能
- 干运行模式
- 更好的错误恢复
- 自动补全功能的进一步优化

### 中期扩展 (v0.4.x+)
- Web管理界面
- 数据库schema对比
- 自动迁移生成
- ORM集成

### 长期愿景
- 多数据库支持
- 云原生部署
- 企业级功能
- 生态系统建设

## 结论

DBShift的设计重点在于简单性、可靠性和团队协作。通过作者分组序号机制解决了核心的协作冲突问题，通过标准SQL兼容性提升了开发者体验，通过模块化架构保证了代码的可维护性。

这些设计决策构成了一个既适合个人项目又能扩展到团队使用的现代化数据库迁移工具。
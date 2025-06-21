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

### 4. 错误处理和重试机制

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
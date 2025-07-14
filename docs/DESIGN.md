# DBShift Design Document

## 概览

本文档记录了 DBShift 项目的关键设计决策、架构选择和技术考量。DBShift 是一个现代化的 MySQL 数据库迁移工具，采用创新的双模式架构（React + Ink 交互模式 + Commander.js CLI 模式），为不同使用场景提供最佳的用户体验。

## 设计目标

### 主要目标
1. **双模式用户体验**: 现代交互界面 + 传统CLI，满足不同用户需求
2. **团队协作友好**: 解决多人协作中的序号冲突问题
3. **标准SQL兼容**: 迁移文件可在任何SQL编辑器中执行
4. **生产环境就绪**: 可靠的错误处理和重试机制
5. **开发者体验优先**: 清晰的反馈和直观的操作流程

### 非目标
- 不支持多数据库（专注MySQL优化）
- 不提供传统Web界面（专注终端体验）
- 不实现复杂回滚（优先前进式迁移）
- 不追求功能大而全（保持工具简洁性）

## 核心架构决策

### 1. 双模式架构设计

#### 设计动机
现代开发者需要不同场景下的不同工具：
- **开发阶段**: 需要友好的交互界面，实时反馈
- **生产部署**: 需要可靠的CLI工具，适合自动化

#### 架构实现

**统一入口设计** (`bin/dbshift.js`):
```javascript
// 参数检测和路由
if (args.includes('-p')) {
    // CLI 模式：dbshift -p -- command args
    executeCommandLine(command);
} else {
    // 交互模式：React + Ink 应用
    startInteractiveMode();
}
```

**模式特性对比**:

| 特性 | 交互模式 (React + Ink) | CLI 模式 (Commander.js) |
|------|----------------------|------------------------|
| 用户界面 | 现代终端UI，对话框驱动 | 传统命令行 |
| 错误处理 | 异常抛出，界面显示 | 进程退出，设置退出码 |
| 适用场景 | 开发调试，学习使用 | 脚本自动化，CI/CD |
| 复杂操作 | 分步向导，表单验证 | 参数传递，一次执行 |

### 2. React + Ink 交互模式

#### 设计决策
选择 React + Ink 而非传统 readline：
- **组件化**: 可重用的对话框组件
- **状态管理**: React Hooks 管理复杂状态
- **用户体验**: 现代化的终端界面
- **可维护性**: 清晰的组件层次结构

#### 组件架构
```
InteractiveApp (主应用)
├── Layout 组件
│   ├── DBShiftLogo
│   ├── WelcomeTips
│   ├── InputBox
│   └── CommandOutputBox
└── Dialog 组件
    ├── InitDialog
    ├── CreateDialog
    ├── ConfigDialog
    ├── ConfigInitDialog
    └── ConfigSetDialog
```

#### 状态管理策略
```javascript
// 使用 React Hooks 管理状态
const [currentDialog, setCurrentDialog] = useState(null);
const [commandOutput, setCommandOutput] = useState('');
const [projectStatus, setProjectStatus] = useState('unknown');

// 自定义 Hooks 封装复杂逻辑
const { history, addToHistory } = useCommandHistory();
const { status, checkStatus } = useProjectStatus();
```

### 3. 作者分组序号机制

#### 问题背景
传统的全局序号系统在团队协作中产生冲突：
```
Alice: 20250714001_Alice_create_users.sql
Bob:   20250714002_Bob_create_posts.sql  
Alice: ❌ 无法创建 20250714003_Alice_xxx.sql (已被占用)
```

#### 解决方案
**每个作者维护独立的序号流水线**：
```javascript
// 算法实现
function generateSequence(dir, date, author) {
  // 1. 扫描目录中的迁移文件
  const files = fs.readdirSync(dir);
  
  // 2. 过滤同日期、同作者的文件
  const authorFiles = files.filter(file => {
    const [fileDate, fileAuthor] = file.split('_');
    return fileDate.startsWith(date) && fileAuthor === author;
  });
  
  // 3. 提取序号，找到最大值
  const sequences = authorFiles.map(file => {
    return parseInt(file.substring(8, 11)); // 提取序号部分
  });
  
  const maxSequence = Math.max(0, ...sequences);
  return String(maxSequence + 1).padStart(3, '0');
}
```

#### 优势分析
- ✅ **消除冲突**: 每个作者独立序号空间
- ✅ **Git友好**: 减少merge conflicts
- ✅ **责任清晰**: 按作者追踪变更
- ✅ **向后兼容**: 不影响现有文件

### 4. 统一错误处理机制

#### 设计原则
不同模式需要不同的错误处理策略：
- **CLI 模式**: 设置正确的退出码，便于脚本检测
- **交互模式**: 显示友好错误信息，保持会话活跃

#### 实现架构
```javascript
class ErrorHandler {
  static async executeWithErrorHandling(fn) {
    try {
      await fn();
      // 成功处理
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(0);  // CLI: 正常退出
      }
      // 交互模式: 继续运行
    } catch (error) {
      const exitCode = this.handle(error);
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(exitCode);  // CLI: 错误退出
      } else {
        throw error;  // 交互模式: 抛给React处理
      }
    }
  }
}
```

#### 错误分类系统
```javascript
// 自定义错误类型
class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.exitCode = 2;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.exitCode = 1;
  }
}
```

### 5. 配置管理系统

#### 多格式支持设计
支持三层配置优先级：

1. **schema.config.js** (优先级最高)
```javascript
module.exports = {
  development: { host: 'localhost', port: 3306, user: 'root', password: 'dev' },
  staging: { host: 'staging-host', port: 3306, user: 'root', password: 'staging' },
  production: { host: 'prod-host', port: 3306, user: 'root', password: 'prod' }
};
```

2. **.env** (中等优先级)
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=myapp
```

3. **环境变量** (回退选项)
```bash
export MYSQL_HOST=production-host
export MYSQL_USERNAME=prod_user
```

#### 加载策略
```javascript
static getCurrentConfig(env = 'development') {
  // 1. 尝试加载 schema.config.js
  if (FileUtils.exists('schema.config.js')) {
    const config = require('./schema.config.js');
    return config[env] || config;
  }
  
  // 2. 回退到 .env 文件
  if (FileUtils.exists('.env')) {
    dotenv.config();
    return this.extractFromEnv();
  }
  
  // 3. 使用环境变量
  return this.extractFromEnv();
}
```

### 6. 迁移文件设计

#### 命名约定
```
格式: YYYYMMDDNN_Author_description.sql
示例: 20250714001_Alice_create_users_table.sql
```

**设计考量**:
- **时间排序**: YYYYMMDD 确保按时间顺序执行
- **作者标识**: 清晰的责任划分
- **序号管理**: NN 支持作者分组序号
- **描述性**: description 提供可读性

#### 模板系统
支持变量替换的标准模板：
```sql
-- Migration: {{DESCRIPTION}}
-- Author: {{AUTHOR}}
-- Created: {{DATE}}
-- Version: {{VERSION}}

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `{{DATABASE_NAME}}` DEFAULT CHARACTER SET utf8mb4;
USE `{{DATABASE_NAME}}`;

-- Add your SQL statements here
-- 每条语句以分号结尾
```

### 7. 数据库设计

#### 迁移历史表设计
```sql
CREATE TABLE `dbshift`.`migration_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT '版本号(YYYYMMDDNN)',
  `author` varchar(20) NOT NULL COMMENT '作者标识',
  `file_desc` varchar(100) NOT NULL COMMENT '文件描述',
  `file_name` varchar(200) NOT NULL COMMENT '完整文件名',
  `status` tinyint(1) DEFAULT '0' COMMENT '0=待执行, 1=已完成',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modify_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_author` (`version`, `author`)
);
```

**设计要点**:
- **唯一约束**: `(version, author)` 防止重复记录
- **状态跟踪**: `status` 字段支持失败重试
- **时间戳**: 创建和修改时间的完整记录
- **灵活性**: 支持按作者、环境查询

## 技术选型

### React + Ink 选择理由

**对比 readline**:
| 特性 | React + Ink | readline |
|------|-------------|----------|
| UI复杂度 | 支持复杂布局 | 单行输入 |
| 状态管理 | React Hooks | 手动管理 |
| 组件复用 | 高 | 低 |
| 学习成本 | 中等（需React知识） | 低 |
| 维护性 | 高 | 中等 |

**最终选择**: React + Ink 提供更好的可扩展性和用户体验。

### Commander.js 选择理由

**对比 yargs**:
| 特性 | Commander.js | yargs |
|------|-------------|-------|
| API 简洁性 | 高 | 中等 |
| TypeScript 支持 | 好 | 很好 |
| 文档质量 | 优秀 | 良好 |
| 包大小 | 小 | 大 |
| 社区活跃度 | 高 | 高 |

**最终选择**: Commander.js 提供简洁的API和良好的性能。

## 性能考量

### 文件扫描优化
```javascript
// 避免递归扫描，只扫描 migrations 目录
const files = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .filter(file => /^\d{11}_/.test(file)); // 快速格式验证
```

### 内存使用优化
```javascript
// 流式处理大型SQL文件
async executeSQLFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  // 避免一次性加载所有文件到内存
}
```

## 安全考量

### SQL注入防护
- 使用参数化查询
- 验证文件名格式
- 限制文件路径访问

### 配置安全
- 不在代码中硬编码密码
- 支持环境变量注入
- 生产环境配置分离

## 可扩展性设计

### 命令扩展
```javascript
// 添加新命令的标准模式
async function newCommand(options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    // 1. 参数验证
    // 2. 业务逻辑
    // 3. 结果输出
  });
}
```

### 对话框扩展
```javascript
// React 组件标准模式
function NewDialog({ onSubmit, onCancel }) {
  const [state, setState] = useState({});
  
  useInput((input, key) => {
    // 键盘事件处理
  });
  
  return (
    <Box flexDirection="column">
      {/* UI 组件 */}
    </Box>
  );
}
```

## 未来路线图

### 短期目标 (v1.0)
- 完善测试覆盖率
- 优化错误信息显示
- 添加更多配置验证

### 中期目标 (v1.x)
- 支持迁移依赖关系
- 添加迁移模板库
- 集成更多CI/CD平台

### 长期目标 (v2.0)
- 支持分布式数据库
- 提供迁移分析工具
- 构建插件生态系统

## 设计权衡

### 复杂性 vs 功能性
**选择**: 优先保持工具简洁，核心功能稳定
**理由**: 避免功能膨胀，确保长期可维护性

### 性能 vs 兼容性
**选择**: 优先兼容性，性能在可接受范围内
**理由**: 数据库迁移通常不是高频操作

### 学习成本 vs 用户体验
**选择**: 提供双模式，满足不同用户需求
**理由**: 既照顾新用户，也满足高级用户需求

---

这份设计文档反映了 DBShift 的核心架构决策和设计理念，为项目的长期发展提供指导。
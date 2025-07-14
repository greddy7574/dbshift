# CI/CD 工作流指南

## 概览

DBShift 使用 GitHub Actions 实现自动化测试和发布流程，确保代码质量和发布的可靠性。项目支持双模式架构（React + Ink 交互模式 + Commander.js CLI 模式），CI/CD 流程需要验证两种模式的功能完整性。

## 🔄 工作流程

### 1. 开发阶段

#### 功能开发
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发和本地测试
npm test                                    # 运行完整测试套件
npm run test:coverage                       # 检查测试覆盖率
node bin/dbshift.js                        # 测试交互模式
node bin/dbshift.js -p -- status          # 测试 CLI 模式

# 提交代码
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

#### Pull Request 工作流
1. **创建 PR** 到 `main` 分支
2. **本地验证**:
   - 运行 `npm test` 确保所有测试通过
   - 运行 `npm run test:coverage` 检查覆盖率
   - 测试双模式功能完整性
3. **代码审查** 和合并到主分支
4. **自动发布** 通过标签触发

### 2. 测试流程

#### 🧪 测试策略

**当前策略**: 发布时测试 + 本地开发测试

**测试集成位置**:
- **发布流程** (`.github/workflows/publish.yml`): 发布前运行完整测试套件
- **本地开发**: 开发者本地运行测试确保代码质量

**测试覆盖范围**:
```bash
# Jest 测试套件
npm test                    # 单元测试 + 集成测试
npm run test:watch          # 开发时监视模式
npm run test:coverage       # 生成详细覆盖率报告

# 手动功能测试
node bin/dbshift.js                        # 交互模式完整流程
node bin/dbshift.js -p -- init            # CLI 模式项目初始化
node bin/dbshift.js -p -- create "test"   # CLI 模式创建迁移
node bin/dbshift.js -p -- migrate         # CLI 模式执行迁移
```

#### 🔧 本地测试工作流

**开发前测试**:
```bash
# 1. 环境检查
node --version              # >= 14.0.0
npm --version              # >= 6.0.0

# 2. 依赖安装
npm install

# 3. 基础功能测试
npm test                   # 确保现有功能正常
```

**开发中测试**:
```bash
# 1. 持续测试
npm run test:watch         # 监视模式，代码变更时自动测试

# 2. 双模式验证
# 交互模式测试
node bin/dbshift.js
# > 测试所有对话框和命令

# CLI 模式测试
node bin/dbshift.js -p -- --help          # 帮助信息
node bin/dbshift.js -p -- status          # 状态检查
node bin/dbshift.js -p -- ping            # 连接测试
```

**提交前测试**:
```bash
# 1. 完整测试套件
npm test

# 2. 覆盖率检查
npm run test:coverage
# 目标: 主要模块 > 80% 覆盖率

# 3. 全局安装测试
npm link
dbshift                    # 测试全局交互模式
dbshift -p -- status     # 测试全局 CLI 模式
npm unlink -g dbshift
```

### 3. 发布流程

#### 🚀 自动化发布工作流

**触发条件**: 推送 `v*` 格式的 git 标签

```bash
# 触发发布的标签格式
git tag v0.3.34           # 补丁版本
git tag v0.4.0            # 次要版本
git tag v1.0.0            # 主要版本
git push origin --tags    # 推送标签触发发布
```

**发布步骤** (`.github/workflows/publish.yml`):

1. **环境准备**
   - 设置 Node.js 14, 16, 18 测试矩阵
   - 安装依赖 (`npm ci`)

2. **完整测试**
   - 运行所有单元测试
   - 运行集成测试
   - 生成覆盖率报告

3. **构建验证**
   - 验证 package.json 配置
   - 检查入口文件 (`bin/dbshift.js`)
   - 验证双模式功能

4. **多平台发布**
   - 发布到 NPM Registry (公共)
   - 发布到 GitHub Packages (`@greddy7574/dbshift`)

5. **发布文档**
   - 创建 GitHub Release
   - 生成详细的 release notes
   - 链接相关 PR 和 issues

#### 📋 发布检查清单

**发布前准备**:
- [ ] 所有测试通过 (`npm test`)
- [ ] 覆盖率达到目标 (`npm run test:coverage`)
- [ ] 双模式功能验证完成
- [ ] 文档更新 (`docs/`, `CLAUDE.md`, `README.md`)
- [ ] 版本号更新 (`package.json`)
- [ ] CHANGELOG.md 更新

**发布命令序列**:
```bash
# 1. 确保在 main 分支
git checkout main
git pull origin main

# 2. 更新版本号
npm version patch     # 或 minor/major

# 3. 推送变更和标签
git push origin main
git push origin --tags

# 4. 验证发布
# GitHub Actions 会自动处理发布流程
# 检查 https://github.com/greddy7574/dbshift/actions
```

**发布后验证**:
```bash
# 1. NPM 包验证
npm view dbshift        # 检查最新版本
npm install -g dbshift  # 全局安装测试

# 2. 功能验证
dbshift --version      # 版本检查
dbshift               # 交互模式测试
dbshift -p -- status # CLI 模式测试

# 3. GitHub Packages 验证
# 检查 https://github.com/greddy7574/dbshift/packages
```

## 🛠️ CI/CD 配置

### GitHub Actions 工作流

#### 发布工作流 (`.github/workflows/publish.yml`)

```yaml
name: Publish to NPM and GitHub Packages

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14, 16, 18]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Run coverage
      run: npm run test:coverage

  publish-npm:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js for NPM
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        registry-url: 'https://registry.npmjs.org'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Publish to NPM
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-github:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js for GitHub Packages
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        registry-url: 'https://npm.pkg.github.com'
        scope: '@greddy7574'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Publish to GitHub Packages
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  create-release:
    needs: [publish-npm, publish-github]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body: |
          ## 🚀 DBShift ${{ github.ref }}
          
          ### 新特性
          - React + Ink 交互模式优化
          - Commander.js CLI 模式增强
          - 统一错误处理机制
          
          ### 安装
          ```bash
          npm install -g dbshift
          ```
          
          ### 使用
          ```bash
          dbshift                    # 交互模式
          dbshift -p -- status     # CLI 模式
          ```
        draft: false
        prerelease: false
```

### 环境变量配置

#### GitHub Secrets

**必需的 Secrets**:
- `NPM_TOKEN`: NPM 发布令牌
- `GITHUB_TOKEN`: GitHub 自动生成（用于 GitHub Packages 和 Release）

**设置方法**:
1. 前往 GitHub 仓库设置
2. 选择 "Secrets and variables" > "Actions"
3. 添加 `NPM_TOKEN`

#### NPM 令牌获取
```bash
# 1. 登录 NPM
npm login

# 2. 创建访问令牌
npm token create --read-only    # 只读令牌（测试用）
npm token create               # 发布令牌（生产用）

# 3. 复制令牌到 GitHub Secrets
```

## 🧪 测试环境

### 单元测试环境

**Jest 配置** (`jest.config.js`):
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!lib/**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
```

### 集成测试环境

**数据库设置**:
```javascript
// test/setup.js - 测试数据库配置
const testConfig = {
  host: process.env.TEST_MYSQL_HOST || 'localhost',
  port: process.env.TEST_MYSQL_PORT || 3306,
  user: process.env.TEST_MYSQL_USER || 'test_user',
  password: process.env.TEST_MYSQL_PASSWORD || 'test_password',
  database: process.env.TEST_MYSQL_DATABASE || 'dbshift_test'
};
```

**CI 环境数据库**:
```yaml
# .github/workflows/publish.yml 中的服务配置
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: dbshift_test
    ports:
      - 3306:3306
    options: >-
      --health-cmd="mysqladmin ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=3
```

## 📊 质量指标

### 测试覆盖率目标

**覆盖率要求**:
- **核心模块** (`lib/core/`): > 90%
- **命令模块** (`lib/commands/`): > 85%
- **工具模块** (`lib/utils/`): > 95%
- **UI 模块** (`lib/ui/`): > 70%

**当前覆盖率检查**:
```bash
npm run test:coverage

# 查看详细报告
open coverage/lcov-report/index.html
```

### 性能基准

**启动时间基准**:
- 交互模式启动: < 2 秒
- CLI 模式命令执行: < 1 秒
- 帮助信息显示: < 0.5 秒

**内存使用基准**:
- 交互模式运行: < 50MB
- CLI 模式执行: < 30MB
- 大型迁移文件处理: < 100MB

## 🚨 故障排除

### 常见 CI/CD 问题

#### NPM 发布失败
```bash
# 错误: 版本已存在
# 解决: 更新版本号
npm version patch
git push origin --tags

# 错误: 权限不足
# 解决: 检查 NPM_TOKEN 配置
```

#### GitHub Actions 失败
```bash
# 错误: 测试失败
# 解决: 本地运行测试，修复问题
npm test

# 错误: 依赖安装失败
# 解决: 检查 package.json 和 package-lock.json
npm ci
```

#### 覆盖率不达标
```bash
# 查看详细覆盖率报告
npm run test:coverage

# 针对性增加测试
# 优先覆盖核心业务逻辑
```

### 发布回滚

**NPM 包回滚**:
```bash
# 废弃问题版本
npm deprecate dbshift@0.3.34 "Version withdrawn due to critical bug"

# 发布修复版本
npm version patch
npm publish
```

**GitHub Release 回滚**:
1. 在 GitHub 界面标记 Release 为 "Pre-release"
2. 创建新的修复版本
3. 删除问题标签（如果需要）

## 📈 监控和分析

### 发布监控

**发布成功指标**:
- GitHub Actions 工作流状态
- NPM 下载统计
- GitHub Packages 下载统计
- 错误报告和用户反馈

**监控工具**:
- GitHub Actions 日志
- NPM 包统计页面
- GitHub Release 下载统计

### 用户反馈收集

**反馈渠道**:
- GitHub Issues
- NPM 包评论
- 用户使用统计（如果实现）

**问题分类**:
- 🐛 Bug 报告
- 💡 功能请求
- 📚 文档问题
- 🚀 性能问题

---

这份 CI/CD 指南确保了 DBShift 项目的自动化发布流程稳定可靠，同时支持双模式架构的完整验证。
# CI/CD 工作流指南

## 概览

DBShift 使用 GitHub Actions 实现自动化测试和发布流程，确保代码质量和发布的可靠性。

## 🔄 工作流程

### 1. 开发阶段

#### 功能开发
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发和测试
npm test
npm run test:coverage

# 提交代码
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

#### Pull Request
- 创建 PR 到 `main` 或 `develop` 分支
- 自动触发测试工作流
- 必须通过所有测试才能合并

### 2. 测试流程

#### 🧪 自动测试 (.github/workflows/test.yml)

**触发条件:**
- Push 到 `main`, `develop` 分支
- 创建或更新 Pull Request

**测试矩阵:**
- Node.js 版本: 16, 18, 20
- 运行环境: Ubuntu Latest

**测试步骤:**
1. **单元测试**: Jest 测试框架
2. **代码质量**: 基本语法和编码检查
3. **安全审计**: npm audit 依赖安全检查
4. **覆盖率**: Codecov 集成 (仅 Node.js 18)

### 3. 发布流程

#### 🚀 自动发布 (.github/workflows/publish.yml)

**触发条件:**
- 推送格式为 `v*` 的 Git 标签 (例如: `v0.3.0`, `v1.0.0`)

**发布步骤:**

1. **预发布测试**
   - 完整的测试套件
   - 确保代码质量

2. **NPM 发布**
   - 发布到 https://npmjs.com
   - 包名: `dbshift`
   - 全球 CDN 分发

3. **GitHub Packages 发布**
   - 发布到 GitHub Package Registry
   - 包名: `@greddy7574/dbshift`
   - 企业级备用源

4. **GitHub Release**
   - 自动创建 GitHub Release
   - 生成详细的 Release Notes
   - 包含安装指令和变更日志

## 📦 发布管理

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/):

- `patch` (0.1.0 → 0.1.1): 错误修复
- `minor` (0.1.0 → 0.2.0): 新功能，向后兼容
- `major` (0.1.0 → 1.0.0): 破坏性变更

### 手动发布流程

```bash
# 1. 确保在 main 分支且代码最新
git checkout main
git pull origin main

# 2. 运行测试确保质量
npm test
npm run test:coverage

# 3. 更新版本号
npm version patch   # 或 minor, major

# 4. 推送代码和标签触发自动发布
git push origin main --tags

# 5. 监控 GitHub Actions
# 访问: https://github.com/greddy7574/dbshift/actions
```

### 发布后验证

```bash
# 验证 NPM 发布
npm view dbshift

# 测试全局安装
npm install -g dbshift@latest
dbshift --version

# 验证 GitHub Packages
npm view @greddy7574/dbshift
```

## 🔧 配置需求

### GitHub Repository Secrets

发布流程需要以下 secrets:

1. **NPM_TOKEN**: NPM 发布权限
   - 创建: https://www.npmjs.com/settings/tokens
   - 类型: Automation token
   - 权限: Publish

2. **GITHUB_TOKEN**: GitHub Packages 发布
   - 自动提供: `${{ secrets.GITHUB_TOKEN }}`
   - 权限: packages:write, contents:write

### 设置 NPM_TOKEN

```bash
# 1. 登录 npmjs.com
# 2. 访问 Access Tokens 页面
# 3. 创建新的 Automation token
# 4. 在 GitHub Repo Settings > Secrets 中添加 NPM_TOKEN
```

## 📊 监控和调试

### GitHub Actions 监控

访问 [Actions 页面](https://github.com/greddy7574/dbshift/actions) 查看:
- 工作流运行状态
- 详细日志
- 失败原因分析

### 常见问题解决

#### 测试失败
```bash
# 本地复现问题
npm test

# 检查具体错误
npm run test:coverage
```

#### 发布失败
- 检查 NPM_TOKEN 是否有效
- 确认版本号是否已存在
- 验证 package.json 配置

#### 权限问题
- 确认 GitHub 仓库权限
- 检查 NPM 包发布权限
- 验证 secrets 配置

## 🎯 最佳实践

### 开发规范
1. **分支策略**: 使用 feature branches
2. **提交信息**: 遵循 conventional commits
3. **测试覆盖**: 保持高测试覆盖率
4. **代码审查**: 所有 PR 需要 review

### 发布规范
1. **测试优先**: 发布前确保所有测试通过
2. **版本递增**: 遵循语义化版本控制
3. **文档更新**: 同步更新 README 和文档
4. **变更记录**: 维护清晰的 CHANGELOG

### 安全考虑
1. **依赖审计**: 定期运行 npm audit
2. **权限最小化**: 仅授予必要的发布权限
3. **密钥轮换**: 定期更新 NPM tokens
4. **版本锁定**: 使用 package-lock.json

## 📈 未来改进

### 计划中的增强
- [ ] 自动化测试报告
- [ ] 性能基准测试
- [ ] 多数据库兼容性测试
- [ ] Docker 容器化测试
- [ ] 自动化 changelog 生成
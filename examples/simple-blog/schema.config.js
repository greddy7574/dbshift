// DBShift 配置文件 - Simple Blog 示例
// 
// 注意：这是示例配置文件，包含示例密码
// 在实际项目中，请：
// 1. 复制此文件为你的实际配置
// 2. 修改密码等敏感信息
// 3. 将实际配置文件添加到 .gitignore 中
//
// 支持多环境配置，生产环境建议使用环境变量

module.exports = {
  // 开发环境配置
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_dev_password',
    database: 'blog_dev'
  },
  
  // 测试环境配置
  test: {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'blog_test'
  },
  
  // 生产环境配置
  // 生产环境建议使用环境变量覆盖这些值
  production: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USERNAME || 'blog_user',
    password: process.env.MYSQL_PASSWORD || 'secure_password',
    database: process.env.MYSQL_DATABASE || 'blog_production'
  }
};
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const { ValidationError } = require('../utils/errors');

async function createCommand(name, options) {
  await ErrorHandler.executeWithErrorHandling(async () => {
    Logger.info(`📝 Creating new migration: ${name}`);

    try {
      // 检查 migrations 目录
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        throw new ValidationError('Migrations directory not found. Run "dbshift init" to initialize the project.');
      }

      // 获取作者信息和迁移类型
      const author = options.author || 'Admin';
      const migrationType = options.migrationType || 'custom'; // Default to custom if not provided

      // 生成版本号
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0');

      // 按作者生成独立的序号，避免多人协作冲突
      const FileUtils = require('../utils/fileUtils');
      const sequence = FileUtils.generateSequence(migrationsDir, dateStr, author);

      const version = dateStr + sequence;
      // 改进的文件名清理：保留连字符，避免连续下划线
      const sanitizedName = name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\-]/g, '_')  // 允许连字符，其他特殊字符转为下划线
        .replace(/_{2,}/g, '_')           // 多个连续下划线合并为一个
        .replace(/^_+|_+$/g, '');         // 移除开头和结尾的下划线
      const filename = `${version}_${author}_${sanitizedName}.sql`;
      const filePath = path.join(migrationsDir, filename);

      // 检查文件是否已存在
      if (fs.existsSync(filePath)) {
        throw new ValidationError(`Migration file already exists: ${filename}`);
      }

      // 生成模板内容
      let template = `-- Migration: ${name}
-- Author: ${author}
-- Created: ${now.toISOString().split('T')[0]}
-- Version: ${version}

-- Use the database
USE \`my_app\`;

`;

      switch (migrationType) {
        case 'create_table':
          template += `-- Create new table
CREATE TABLE IF NOT EXISTS \`your_table_name\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
          break;

        case 'alter_table':
          template += `-- Alter existing table
-- ALTER TABLE \`your_table_name\` ADD COLUMN \`new_column\` VARCHAR(255);
-- ALTER TABLE \`your_table_name\` DROP COLUMN \`old_column\`;
-- ALTER TABLE \`your_table_name\` MODIFY COLUMN \`existing_column\` TEXT;
`;
          break;

        case 'insert_data':
          template += `-- Insert initial data
-- INSERT INTO \`your_table_name\` (\`column1\`, \`column2\`) VALUES
--   ('value1', 'value2'),
--   ('value3', 'value4');
`;
          break;

        case 'create_index':
          template += `-- Create indexes
-- CREATE INDEX \`idx_column_name\` ON \`your_table_name\` (\`column_name\`);
-- CREATE UNIQUE INDEX \`idx_unique_column\` ON \`your_table_name\` (\`unique_column\`);
`;
          break;

        default:
          template += `-- Add your custom SQL here
-- Remember to test your SQL before running migration

`;
      }

      template += `
-- Example:
-- CREATE TABLE test1 (id INT);
-- CREATE TABLE test2 (id INT);
`;

      // 写入文件
      fs.writeFileSync(filePath, template);

      console.log(chalk.green(`✓ Created migration file: ${filename}`));
      console.log(chalk.gray(`   Path: ${filePath}`));
      console.log(chalk.blue('\n📝 Next steps:'));
      console.log(chalk.gray('  1. Edit the migration file with your SQL'));
      console.log(chalk.gray('  2. Run "dbshift migrate" to execute the migration'));

    } catch (error) {
      throw error;
    }
  });
}

module.exports = createCommand;

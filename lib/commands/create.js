const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function createCommand(name, options) {
  console.log(chalk.blue(`📝 Creating new migration: ${name}`));

  try {
    // 检查 migrations 目录
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(chalk.red('✗ Migrations directory not found'));
      console.log(chalk.yellow('Run "dbshift init" to initialize the project'));
      process.exit(1);
    }

    // 获取作者信息
    const author = options.author || 'Admin';

    // 生成版本号
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    // 查找当天的现有迁移文件
    const existingFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.startsWith(dateStr))
      .sort();

    // 生成序号
    let sequence = '01';
    if (existingFiles.length > 0) {
      const lastFile = existingFiles[existingFiles.length - 1];
      const lastSequence = parseInt(lastFile.substring(8, 10));
      sequence = (lastSequence + 1).toString().padStart(2, '0');
    }

    const version = dateStr + sequence;
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${version}_${author}_${sanitizedName}.sql`;
    const filePath = path.join(migrationsDir, filename);

    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      console.error(chalk.red(`✗ Migration file already exists: ${filename}`));
      process.exit(1);
    }

    // 询问迁移类型以生成模板
    const { migrationType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'migrationType',
        message: 'Choose migration type:',
        choices: [
          { name: 'Create Table', value: 'create_table' },
          { name: 'Alter Table', value: 'alter_table' },
          { name: 'Insert Data', value: 'insert_data' },
          { name: 'Create Index', value: 'create_index' },
          { name: 'Custom SQL', value: 'custom' }
        ]
      }
    ]);

    // 生成模板内容
    let template = `-- Migration: ${name}
-- Author: ${author}
-- Created: ${now.toISOString().split('T')[0]}
-- Version: ${version}

-- Use the database
USE \`my_app\`;;
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
-- Note: Use semicolon-semicolon (;;) to separate multiple statements if needed
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
    console.error(chalk.red('✗ Failed to create migration:'), error.message);
    process.exit(1);
  }
}

module.exports = createCommand;

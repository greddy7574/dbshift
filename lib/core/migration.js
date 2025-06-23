const path = require('path');
const Logger = require('../utils/logger');
const FileUtils = require('../utils/fileUtils');

class MigrationManager {
  constructor(database) {
    this.database = database;
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  async findMigrationFiles() {
    if (!FileUtils.exists(this.migrationsPath)) {
      Logger.warning('⚠ Migrations directory not found. Run "dbshift init" to create it.');
      return [];
    }

    const files = FileUtils.listFiles(this.migrationsPath, '.sql');

    return files.map(filename => {
      const parts = filename.split('_');
      const version = parts[0];
      const author = parts[1];
      const description = filename
        .replace(`${version}_${author}_`, '')
        .replace('.sql', '')
        .replace(/_/g, ' ');

      return {
        filename,
        version,
        author,
        description,
        path: path.join(this.migrationsPath, filename)
      };
    });
  }

  async getExecutedMigrations() {
    try {
      const [rows] = await this.database.connection.query(
        'SELECT * FROM `dbshift`.`migration_history` ORDER BY version, author'
      );
      return rows;
    } catch (error) {
      Logger.warning('⚠ Migration table not found or inaccessible');
      return [];
    }
  }

  async getPendingMigrations() {
    const allMigrations = await this.findMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    
    const executedMap = new Map();
    executedMigrations.forEach(migration => {
      executedMap.set(`${migration.version}_${migration.author}`, migration);
    });

    return allMigrations.filter(migration => {
      const key = `${migration.version}_${migration.author}`;
      const executed = executedMap.get(key);
      return !executed || executed.status === 0;
    });
  }

  async recordMigration(migration) {
    const query = `
      INSERT INTO \`dbshift\`.\`migration_history\`
      (version, author, file_desc, file_name, status, create_date)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        file_desc = VALUES(file_desc),
        file_name = VALUES(file_name),
        status = 0,
        modify_date = NOW()
    `;

    await this.database.connection.query(query, [
      migration.version,
      migration.author,
      migration.description,
      migration.filename,
      0 // 0 = pending, 1 = completed
    ]);
  }

  async markMigrationCompleted(migration) {
    const query = `
      UPDATE \`dbshift\`.\`migration_history\`
      SET status = 1, modify_date = NOW()
      WHERE version = ? AND author = ?
    `;

    await this.database.connection.query(query, [
      migration.version,
      migration.author
    ]);
  }

  async executeMigration(migration) {
    try {
      Logger.step(`Executing ${migration.filename}...`);
      
      // 记录迁移开始
      await this.recordMigration(migration);
      
      // 执行 SQL 文件
      await this.database.executeSQLFile(migration.path);
      
      // 标记为完成
      await this.markMigrationCompleted(migration);
      
      Logger.checkmark(`${migration.filename} completed`);
    } catch (error) {
      Logger.crossmark(`${migration.filename} failed: ${error.message}`);
      throw error;
    }
  }

  async runMigrations() {
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      Logger.checkmark('No pending migrations');
      return;
    }

    Logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    Logger.checkmark('All migrations completed successfully');
  }

  generateMigrationFilename(name, author = 'Admin') {
    const dateStr = FileUtils.generateTimestamp();
    const sequence = FileUtils.generateSequence(this.migrationsPath, dateStr);
    const version = dateStr + sequence;
    
    // 改进的文件名清理：保留连字符，避免连续下划线
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\-]/g, '_')  // 允许连字符，其他特殊字符转为下划线
      .replace(/_{2,}/g, '_')           // 多个连续下划线合并为一个
      .replace(/^_+|_+$/g, '');         // 移除开头和结尾的下划线
    return `${version}_${author}_${sanitizedName}.sql`;
  }
}

module.exports = MigrationManager;
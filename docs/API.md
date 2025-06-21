# API Reference

## Core Classes

### Database

Handles database connections and SQL execution.

```javascript
const Database = require('./lib/core/database');

const db = new Database({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password'
});

await db.connect();
await db.executeSQLFile('/path/to/migration.sql');
await db.disconnect();
```

#### Methods

- `connect()` - Establish database connection
- `disconnect()` - Close database connection
- `initializeMigrationTable()` - Create migration tracking table (`dbshift.migration_history`)
- `executeSQL(sql)` - Execute SQL query
- `executeSQLFile(filePath)` - Execute SQL file with automatic statement splitting

### MigrationManager

Manages migration files and execution.

```javascript
const MigrationManager = require('./lib/core/migration');

const manager = new MigrationManager(database);
const migrations = await manager.findMigrationFiles();
await manager.runMigrations();
```

#### Methods

- `findMigrationFiles()` - Scan for migration files
- `getExecutedMigrations()` - Get completed migrations from database
- `getPendingMigrations()` - Get migrations that need to run (status=0)
- `runMigrations()` - Execute all pending migrations
- `executeMigration(migration)` - Execute single migration with retry support
- `recordMigration(migration)` - Record migration start (handles duplicates)
- `markMigrationCompleted(migration)` - Mark migration as completed (status=1)
- `generateMigrationFilename(name, author)` - Generate migration filename

### Config

Handles configuration loading and validation.

```javascript
const Config = require('./lib/core/config');

const config = new Config('development');
const dbConfig = config.load();
config.validate();
```

#### Methods

- `load()` - Load configuration from files
- `validate()` - Validate configuration
- `get()` - Get configuration object

## Utility Classes

### Logger

Provides colored console output.

```javascript
const Logger = require('./lib/utils/logger');

Logger.info('Information message');
Logger.success('Success message');
Logger.warning('Warning message');
Logger.error('Error message');
Logger.step('Step message');
Logger.checkmark('Completed task');
Logger.crossmark('Failed task');
```

### FileUtils

File system operations.

```javascript
const FileUtils = require('./lib/utils/fileUtils');

FileUtils.exists('/path/to/file');
FileUtils.readFile('/path/to/file');
FileUtils.writeFile('/path/to/file', 'content');
FileUtils.listFiles('/path/to/dir', '.sql');
```

#### Methods

- `exists(filePath)` - Check if file exists
- `readFile(filePath)` - Read file content
- `writeFile(filePath, content)` - Write file content
- `ensureDir(dirPath)` - Create directory if not exists
- `listFiles(dirPath, extension)` - List files in directory
- `generateTimestamp()` - Generate YYYYMMDD timestamp
- `generateSequence(dirPath, dateStr)` - Generate sequence number

### Validator

Input validation utilities.

```javascript
const Validator = require('./lib/utils/validator');

Validator.validateConfig(config);
Validator.validateMigrationName('create_users_table');
Validator.validateAuthorName('Admin');
Validator.validateDatabaseConnection(config);
```

#### Methods

- `validateConfig(config)` - Validate database configuration
- `validateMigrationName(name)` - Validate migration name format
- `validateAuthorName(author)` - Validate author name format
- `validateDatabaseConnection(config)` - Validate connection parameters

## Configuration Management

DBShift v0.2.0+ includes enhanced configuration management commands:

### Configuration Commands

#### `dbshift config [options]`
Show current database configuration and available environments.

```bash
dbshift config                    # Show development config
dbshift config -e production      # Show production config
```

**Output includes:**
- Current configuration file type (.env or schema.config.js)
- Database connection details for specified environment
- List of all available environments (for schema.config.js)

#### `dbshift config-init [options]`
Interactive configuration setup wizard.

```bash
dbshift config-init               # Setup development environment
dbshift config-init -e production # Setup production environment
```

**Features:**
- Interactive prompts for all database settings
- Choice between .env and schema.config.js formats
- Automatic database connection testing
- Handles existing configuration updates

#### `dbshift config-set [options]`
Direct configuration value setting for automation and scripts.

```bash
# Set multiple values
dbshift config-set --host=localhost --user=root --password=123456

# Set production config
dbshift config-set --host=prod-host --user=prod-user -e production

# Update single values
dbshift config-set --port=3307
dbshift config-set --password=newpass -e production
```

**Options:**
- `--host <host>` - Database host
- `--port <port>` - Database port
- `--user <user>` - Database username  
- `--password <password>` - Database password
- `-e, --env <environment>` - Target environment

**Smart Features:**
- Automatically detects configuration file type
- Creates schema.config.js for non-development environments
- Adds environment variable fallbacks for production
- Tests database connection after changes

## Error Handling

All methods throw descriptive errors that can be caught and handled:

```javascript
try {
  await database.connect();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    Logger.error('Database connection refused. Is MySQL running?');
  } else {
    Logger.error(`Database error: ${error.message}`);
  }
}
```

## Configuration

### Environment Variables

- `MYSQL_HOST` - Database host (default: localhost)
- `MYSQL_PORT` - Database port (default: 3306)
- `MYSQL_USERNAME` - Database username (default: root)
- `MYSQL_PASSWORD` - Database password

### Configuration Files

#### .env Format
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
```

#### schema.config.js Format
```javascript
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'dev_password'
  },
  production: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD
  }
};
```

## Database Schema

### migration_history Table

DBShift uses a dedicated table to track migration execution:

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

#### Fields Description

- `id`: Auto-increment primary key
- `version`: Migration version (YYYYMMDDNN format)
- `author`: Migration author name
- `file_desc`: Human-readable description
- `file_name`: Full migration filename
- `status`: Execution status (0=pending, 1=completed)
- `create_date`: When migration was first recorded
- `modify_date`: Last update timestamp
- `uk_version_author`: Unique constraint prevents duplicate execution

#### Retry Mechanism

- Failed migrations keep `status=0` and can be safely retried
- On retry, `modify_date` is updated while preserving `create_date`
- Unique constraint prevents duplicate records for the same migration
- System tracks complete execution history with timestamps
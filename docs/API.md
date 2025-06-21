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
  password: 'passw/ord'
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
- `executeSQLFile(filePath)` - Execute SQL file with standard SQL parsing (v0.2.1+ simplified)

#### executeSQLFile Method (v0.2.1+ Simplified)

**Standard SQL Processing**: DBShift v0.2.1+ uses simplified SQL file processing that works with any SQL editor.

```javascript
const Database = require('./lib/core/database');

const db = new Database(config);
await db.connect();
await db.executeSQLFile('./migrations/20250621001_create_users.sql');
```

**Processing Logic:**
```javascript
async executeSQLFile(filePath) {
  const content = FileUtils.readFile(filePath);
  const statements = content
    .split(';')                           // Split by semicolons
    .map(stmt => stmt.trim())             // Trim whitespace
    .filter(stmt => stmt.length > 0);     // Remove empty statements
  
  for (const statement of statements) {
    const sqlContent = statement
      .replace(/--.*$/gm, '')             // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove multi-line comments
      .trim();
    
    if (!sqlContent) continue;
    await this.connection.query(sqlContent);
  }
}
```

**Features:**
- ✅ **Standard SQL**: Uses semicolon (`;`) separators only
- ✅ **Universal Compatibility**: Works in MySQL Workbench, phpMyAdmin, command line
- ✅ **Comment Removal**: Automatically removes `--` and `/* */` comments
- ✅ **No Special Syntax**: No need for `DELIMITER` or `;;` separators
- ✅ **Editor Friendly**: Files can be executed directly in any SQL tool

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

### ConnectionTester (v0.2.3+)

Database connection testing utility for the `ping` command and configuration validation.

```javascript
const ConnectionTester = require('./lib/utils/connectionTester');

// Test database connection
const result = await ConnectionTester.testConnection(dbConfig, {
  verbose: true,              // Show detailed output
  testMigrationTable: true    // Test migration table access
});

// Test migration table access only
const migrationResult = await ConnectionTester.testMigrationTableAccess(dbConfig);

// Show troubleshooting suggestions for errors
ConnectionTester.showTroubleshootingSuggestions(error);
```

#### Methods

- `testConnection(dbConfig, options)` - Test database connection with detailed diagnostics
  - **Parameters:**
    - `dbConfig` - Database configuration object
    - `options.verbose` - Show detailed console output (default: true)
    - `options.testMigrationTable` - Test migration table access (default: false)
  - **Returns:** Promise resolving to connection result object
  
- `testMigrationTableAccess(dbConfig, verbose)` - Test migration table access
  - **Parameters:**
    - `dbConfig` - Database configuration object
    - `verbose` - Show console output (default: true)
  - **Returns:** Promise resolving to migration table status
  
- `showTroubleshootingSuggestions(error)` - Display error-specific troubleshooting tips
  - **Parameters:**
    - `error` - Error object with error code

#### Connection Result Object

```javascript
{
  success: true,
  mysql_version: "8.0.28",
  server_comment: "MySQL Community Server",
  timing: {
    connect: 45,    // Connection time in ms
    query: 12,      // Query time in ms
    total: 67       // Total time in ms
  },
  migration: {      // Only if testMigrationTable: true
    table_exists: true,
    total_migrations: 10,
    completed_migrations: 8,
    pending_migrations: 2
  }
}
```

#### Error Handling

ConnectionTester provides specific troubleshooting suggestions for common database errors:

- `ECONNREFUSED` - Server connection issues
- `ER_ACCESS_DENIED_ERROR` - Authentication problems
- `ENOTFOUND` - DNS/hostname resolution
- `ER_BAD_DB_ERROR` - Database does not exist

#### Additional FileUtils Methods

- `listFiles(dirPath, extension)` - List files in directory
- `generateTimestamp()` - Generate YYYYMMDD timestamp
- `generateSequence(dirPath, dateStr, author)` - Generate author-based sequence number (v0.2.1+)

#### generateSequence Method (v0.2.1+)

**Author-Based Sequence Numbering**: This method implements independent sequence numbering per author to prevent team collaboration conflicts.

```javascript
const FileUtils = require('./lib/utils/fileUtils');

// Generate sequence for different authors on the same day
const aliceSeq = FileUtils.generateSequence('./migrations', '20250621', 'alice');  // Returns '01'
const bobSeq = FileUtils.generateSequence('./migrations', '20250621', 'bob');      // Returns '01' (independent)
const aliceSeq2 = FileUtils.generateSequence('./migrations', '20250621', 'alice'); // Returns '02'
```

**Parameters:**
- `dirPath` (string): Path to migrations directory
- `dateStr` (string): Date string in YYYYMMDD format
- `author` (string): Author name for sequence grouping

**Returns:** Two-digit sequence number as string (e.g., '01', '02', '99')

**Behavior:**
- Filters migration files by date prefix and author name
- Finds the maximum sequence number for the given author and date
- Returns the next available sequence number
- Each author maintains independent sequence numbering
- Prevents conflicts in multi-developer environments

**Example file matching:**
```
20250621001_alice_create_users.sql  → alice sequence 01
20250621001_bob_create_posts.sql    → bob sequence 01 (no conflict)
20250621002_alice_add_index.sql     → alice sequence 02
```

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

## Interactive Mode (v0.2.4+)

DBShift v0.2.4+ introduces interactive mode for better user experience.

### Interactive Mode Entry

```bash
# Start interactive mode
dbshift
```

### Interactive Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/` | Show available commands | `/` |
| `/init` | Initialize new project | `/init` |
| `/migrate` | Run pending migrations | `/migrate -e production` |
| `/status` | Show migration status | `/status` |
| `/create` | Create new migration | `/create add_users --author=john` |
| `/config` | Configuration management | `/config` |
| `/ping` | Test database connection | `/ping --host=localhost` |
| `/clear` | Clear screen | `/clear` |
| `q` | Quit interactive mode | `q` |

### Interactive Mode API

```javascript
const DBShiftInteractive = require('./bin/dbshift');

// Core methods available for extending interactive mode
class DBShiftInteractive {
  showWelcome()                    // Display welcome screen
  showMainMenu()                   // Display main menu  
  showConfigMenu()                 // Display config submenu
  handleInput(input)               // Process user input
  routeCommand(command, args)      // Route commands to handlers
  parseEnvFromArgs(args)          // Parse environment flags
  parseAuthorFromArgs(args)       // Parse author flags
  parsePingOptions(args)          // Parse ping command options
}
```

### Context Management

The interactive mode supports context switching:

```javascript
// Main context - shows all primary commands
currentContext = 'main'

// Config context - shows configuration commands
currentContext = 'config'
```

## Configuration Management

DBShift v0.2.0+ includes enhanced configuration management commands:

### Configuration Commands

#### `dbshiftcli config [options]`
Show current database configuration and available environments.

```bash
dbshiftcli config                    # Show development config
dbshiftcli config -e production      # Show production config
```

**Output includes:**
- Current configuration file type (.env or schema.config.js)
- Database connection details for specified environment
- List of all available environments (for schema.config.js)

#### `dbshiftcli config-init [options]`
Interactive configuration setup wizard.

```bash
dbshiftcli config-init               # Setup development environment
dbshiftcli config-init -e production # Setup production environment
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

## CI/CD Integration

### GitHub Actions Workflows

DBShift includes automated testing and publishing workflows:

#### Test Workflow (`.github/workflows/test.yml`)
Triggered on push to main/develop branches or Pull Requests:

```yaml
name: 🧪 Test & Quality Checks
# Multi-version Node.js testing (16, 18, 20)
# Unit tests, code quality, security audit
```

#### Publish Workflow (`.github/workflows/publish.yml`)
Triggered on git tag push (v* pattern):

```yaml
name: 🚀 Publish to NPM & GitHub Packages
# Dual registry publishing
# Automated GitHub Release creation
```

### Publishing API

#### NPM Registry
```bash
# Global installation
npm install -g dbshift

# Version checking
npm view dbshift version
npm view dbshift versions --json
```

#### GitHub Package Registry
```bash
# Scoped installation
npm install -g @greddy7574/dbshift

# Registry configuration
echo "@greddy7574:registry=https://npm.pkg.github.com" >> .npmrc
```

### Release Management

#### Semantic Versioning
- `patch`: Bug fixes (0.1.0 → 0.1.1)
- `minor`: New features (0.1.0 → 0.2.0)
- `major`: Breaking changes (0.1.0 → 1.0.0)

#### Automated Release Notes
Generated release notes include:
- Package installation instructions
- What's changed (git log)
- Core features summary
- Technical stack information
- Installation verification commands

### Development Workflow

```bash
# Development with testing
npm test                    # Run Jest test suite
npm run test:coverage       # Generate coverage report
npm run test:watch          # Watch mode for development

# Version management
npm version patch           # Update version number
git push origin main --tags # Trigger publishing workflow

# Monitor CI/CD
# Visit: https://github.com/greddy7574/dbshift/actions
```

### Quality Gates

The CI/CD pipeline enforces:
- **Unit test coverage**: Jest test framework
- **Multi-version compatibility**: Node.js 16, 18, 20
- **Security audit**: npm audit for vulnerabilities
- **Code quality**: Basic syntax and structure validation
- **Dependency safety**: Automated security scanning

For detailed CI/CD documentation, see [CI-CD.md](./CI-CD.md).

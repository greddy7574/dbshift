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

## Interactive Mode (v0.3.0+)

DBShift v0.3.0+ introduces enhanced interactive mode with Tab auto-completion. v0.3.1 fixes critical session persistence issues. v0.3.2 perfects the user experience with Claude Code-like display format. v0.3.4 adds live auto-completion, and v0.3.5 completely fixes session persistence for all commands.

### Interactive Mode Entry

```bash
# Start interactive mode
dbshift
```

### Live Auto-Completion Feature (v0.3.4+)

The interactive mode includes real-time live auto-completion that responds instantly to user input:

#### Live Auto-Completion Implementation (v0.3.4)

```javascript
// Keypress event detection for live auto-completion
readline.emitKeypressEvents(process.stdin);

class DBShiftInteractive {
  setupReadline() {
    // Intercept readline output to detect input changes
    const originalWrite = this.rl._writeToOutput;
    this.rl._writeToOutput = (stringToWrite) => {
      const result = originalWrite.call(this.rl, stringToWrite);
      
      // Check input changes in next event loop
      setImmediate(() => {
        const currentLine = this.rl.line || '';
        this.updateLiveCommandsForInput(currentLine);
      });
      
      return result;
    };
  }
  
  updateLiveCommandsForInput(input) {
    if (input.startsWith('/')) {
      this.showLiveCommands(input);  // Show filtered commands immediately
    } else if (this.isShowingLiveCommands) {
      this.hideLiveCommands();       // Hide command list
    }
  }
  
  showLiveCommands(filter = '/') {
    const currentCommands = this.currentContext === 'config' 
      ? this.commands.config 
      : this.commands.main;
    
    // Filter matching commands
    const filteredCommands = currentCommands.filter(cmd => 
      cmd.command.startsWith(filter)
    );
    
    // Avoid re-rendering if commands haven't changed
    if (this.isShowingLiveCommands && this.lastFilteredCommands && 
        JSON.stringify(this.lastFilteredCommands) === JSON.stringify(filteredCommands)) {
      return;
    }
    
    // Display filtered commands with smart terminal control
    // ...
  }
}
```

### Tab Auto-Completion Feature (v0.3.0+)

The interactive mode also includes traditional Tab auto-completion using readline's completer function:

```javascript
// Tab auto-completion completer function
completer(line) {
  const currentCommands = this.currentContext === 'config' 
    ? this.commands.config 
    : this.commands.main;
  
  const completions = currentCommands.map(cmd => cmd.command);
  
  if (line.startsWith('/')) {
    const hits = completions.filter(c => c.startsWith(line));
    
    // Display matching commands with descriptions
    if (hits.length > 1) {
      console.log('\n📋 Available Commands:');
      hits.forEach(hit => {
        const cmdInfo = currentCommands.find(c => c.command === hit);
        console.log(`  ${hit.padEnd(15)} ${cmdInfo.description}`);
      });
    }
    
    return [hits, line];
  }
  
  return [[], line];
}

// Legacy command selector (still available)
showCommandSelector() {
  // 1. Pause current readline interface
  this.rl.pause();
  
  // 2. Show interactive command picker using inquirer
  const { command } = await inquirer.prompt([{
    type: 'list',
    name: 'command',
    message: 'Select a command:',
    choices: contextAwareChoices,
    pageSize: 10
  }]);
  
  // 3. Resume readline and execute selected command
  this.rl.resume();
  await this.handleInput(command);
}
```

### Interactive Commands

| Command | Description | Example | Session Persistence |
|---------|-------------|---------|---------------------|
| `/` | **Live auto-completion** - Shows commands instantly as you type (v0.3.4) | `/` | ✅ |
| `/` + Tab | **Tab auto-completion** - Traditional command completion with descriptions | `/` + Tab | ✅ |
| `/init` | Initialize new project | `/init` | ✅ Fixed v0.3.5 |
| `/migrate` | Run pending migrations | `/migrate -e production` | ✅ |
| `/status` | Show migration status | `/status` | ✅ Fixed v0.3.5 |
| `/history` | Show detailed migration execution history | `/history -a John` | ✅ New v0.3.25 |
| `/create` | Create new migration with guided input | `/create` | ✅ Fixed v0.3.5 |
| `/config` | Configuration management | `/config` | ✅ |
| `/ping` | Test database connection | `/ping --host=localhost` | ✅ |
| `/clear` | Clear screen | `/clear` | ✅ |
| `/help` | Show text-based help menu | `/help` | ✅ |
| `q` | Quit interactive mode | `q` | N/A (exits) |

#### Key Improvements (v0.3.4 - v0.3.26)
- **Live Auto-Completion**: Type "/" to instantly see commands, type "/i" to filter to init-related commands
- **Perfect Session Persistence**: ALL commands now return to prompt after execution (fixed in v0.3.5)
- **Clean Filenames**: Intelligent sanitization prevents multiple underscores (v0.3.26)
- **Short Parameter Support**: Use `-a jerry` instead of `--author=jerry` for faster typing (v0.3.26)
- **Unified Error Handling**: Consistent ErrorHandler pattern across all commands
- **Real-time Filtering**: Commands filter as you type without needing to press Enter

### Guided Command Execution

Complex commands like `/create` now provide step-by-step guidance:

```javascript
// Example: Guided migration creation
async handleCreateCommand() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'migrationName',
      message: 'Enter migration name:',
      validate: (input) => {
        if (!input.trim()) return 'Migration name cannot be empty';
        if (!/^[a-zA-Z0-9_]+$/.test(input.trim())) {
          return 'Migration name can only contain letters, numbers, and underscores';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'author', 
      message: 'Enter author name (optional):',
      default: 'Admin'
    }
  ]);
  
  const command = `/create ${answers.migrationName} --author=${answers.author}`;
  console.log(chalk.blue(`📝 Creating migration: ${answers.migrationName}`));
  await this.handleInput(command);
}
```

### Interactive Mode API

```javascript
const DBShiftInteractive = require('./bin/dbshift');

// Core methods available for extending interactive mode
class DBShiftInteractive {
  showWelcome()                    // Display welcome screen
  showMainMenu()                   // Display main menu  
  showConfigMenu()                 // Display config submenu
  showCommandSelector()            // Display auto-completion menu (v0.3.0)
  handleCreateCommand()            // Handle guided migration creation (v0.3.0)
  handleInput(input)               // Process user input
  routeCommand(command, args)      // Route commands to handlers
  parseEnvFromArgs(args)          // Parse environment flags
  parseAuthorFromArgs(args)       // Parse author flags
  parsePingOptions(args)          // Parse ping command options
}
```

### Context Management

The interactive mode supports context switching with enhanced menu system:

```javascript
// Main context - shows all primary commands
currentContext = 'main'
// Available commands: init, migrate, status, create, config, ping, clear, help

// Config context - shows configuration commands  
currentContext = 'config'
// Available commands: config show, config init, config set, back

// Context-aware command choices
generateChoicesForContext() {
  if (this.currentContext === 'config') {
    return configMenuChoices;
  } else {
    return mainMenuChoices;
  }
}
```

### Auto-Completion Implementation Details

#### Choice Generation

```javascript
// Main menu choices
const mainMenuChoices = [
  { name: '🚀 Initialize new project', value: '/init' },
  { name: '📦 Run pending migrations', value: '/migrate' },
  { name: '📊 Show migration status', value: '/status' },
  { name: '📝 Create new migration', value: '/create', needsInput: true },
  { name: '⚙️ Configuration management', value: '/config' },
  { name: '🏓 Test database connection', value: '/ping' },
  { name: '🧹 Clear screen', value: '/clear' },
  { name: '❓ Show help', value: '/help' },
  { name: '❌ Cancel', value: 'cancel' }
];

// Config submenu choices
const configMenuChoices = [
  { name: '📋 Show current configuration', value: '/config show' },
  { name: '⚙️ Interactive configuration setup', value: '/config init' },
  { name: '🔧 Set configuration values', value: '/config set' },
  { name: '🔙 Back to main menu', value: '/back' },
  { name: '❌ Cancel', value: 'cancel' }
];
```

#### Interface State Management

```javascript
// Readline interface lifecycle
1. Normal state: readline.createInterface() listening for input
2. Auto-completion state: this.rl.pause() → inquirer takes control
3. Command execution: this.rl.resume() → back to normal state
4. Error recovery: catch blocks ensure resume() is called

// Error handling pattern
try {
  this.rl.pause();
  const result = await inquirer.prompt([...]);
  this.rl.resume();
  await this.handleSelectedCommand(result.command);
} catch (error) {
  this.rl.resume(); // Always resume on error
  console.error(chalk.red('❌ Error:'), error.message);
  this.rl.prompt();
}
```

### Interactive Mode Improvements

#### User Experience Enhancement (v0.3.2)

**Claude Code-Style Display Format**:
v0.3.2 introduces a major visual improvement to match the Claude Code experience:

**Command Selector Format Change**:
```
Before (v0.3.1):
🚀 Initialize new project
📦 Run pending migrations
📊 Show migration status

After (v0.3.2):
/init                Initialize new project
/migrate             Run pending migrations
/status              Show migration status
```

**Key Improvements**:
- **Clear Command Visibility**: Left side shows actual executable commands
- **Consistent Alignment**: Uniform spacing for better readability  
- **Reduced Visual Noise**: Fewer emojis, focus on functionality
- **Tab Completion Consistency**: Same format across menu and auto-completion

**Final Session Persistence Fix**:
- **Eliminated Duplicate Output**: Fixed repeated log messages in routeCommand
- **Complete Session Recovery**: All commands (success/error) return to interactive prompt
- **Verified Workflow**: `/status` -> `/help` -> `q` flow works perfectly

#### Interactive Mode Persistence (v0.3.1 Fix)

#### Problem Resolution

**Issue**: Commands would terminate the interactive session after execution (v0.3.0 critical bug).

**Root Cause**: 
- Command modules called `process.exit(1)` on errors
- **Critical**: `ErrorHandler.executeWithErrorHandling()` called `process.exit(0)` on **success**
- Both successful and failed commands terminated the entire Node.js process

**Solution**: Comprehensive environment-aware error handling system (v0.3.1).

#### Implementation

**Environment Detection**:
```javascript
// Set when interactive mode starts
process.env.DBSHIFT_INTERACTIVE_MODE = 'true';
```

**Critical ErrorHandler Fix (v0.3.1)**:
```javascript
// lib/utils/errorHandler.js - The core issue was here
static async executeWithErrorHandling(fn) {
  try {
    await fn();
    // v0.3.1 CRITICAL FIX: Don't exit on success in interactive mode
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(0);  // Only exit in CLI mode
    }
    // Interactive mode: simply return, keep session alive
  } catch (error) {
    const exitCode = this.handle(error);
    if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
      process.exit(exitCode);
    } else {
      throw error; // Let interactive mode handle the error
    }
  }
}
```

**Command Module Adaptation**:
```javascript
// Before: Always exit on error
catch (error) {
  console.error('Command failed:', error.message);
  process.exit(1); // Terminates interactive mode
}

// After: Conditional error handling
catch (error) {
  console.error('Command failed:', error.message);
  if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
    process.exit(1); // CLI mode: exit process
  } else {
    throw error;     // Interactive mode: throw for upper handling
  }
}
```

**Interactive Mode Error Capture**:
```javascript
async routeCommand(command, args) {
  switch (command) {
    case '/init':
      try {
        await initCommand();
        console.log(chalk.green('✅ Project initialized successfully!'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to initialize project:'), error.message);
      }
      break; // Session continues regardless of success/failure
      
    case '/create':
      try {
        const migrationName = args[0];
        const author = this.parseAuthorFromArgs(args);
        await createCommand(migrationName, { author });
        console.log(chalk.green('✅ Migration file created successfully!'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to create migration:'), error.message);
      }
      break; // Session persists
  }
}
```

#### Benefits

- **Session Persistence**: Commands complete and return to prompt
- **Error Recovery**: Failed commands display errors but keep session alive
- **Backward Compatibility**: CLI mode behavior unchanged
- **User Experience**: Continuous workflow without restarts

## History Command (v0.3.25)

DBShift v0.3.25 introduces the `history` command for viewing detailed migration execution history.

### `dbshiftcli history [options]`
Show detailed migration execution history with timestamps, execution status, and author information.

```bash
dbshiftcli history                   # Show all migration history
dbshiftcli history --author=John     # Filter by specific author
dbshiftcli history -e production     # Show production environment history
```

**Output includes:**
- Migration execution status (Completed/Pending)
- Version number and author information
- File description and name
- Execution timestamps (create_date/modify_date)
- Summary statistics by total, completed, and pending counts
- Author statistics breakdown (when not filtered by author)

**Options:**
- `-e, --env <environment>` - Specify target environment (default: development)
- `-a, --author <author>` - Filter history records by author name

**Use Cases:**
- Track migration execution progress across environments
- Audit who executed which migrations and when
- Debug migration issues by viewing execution history
- Monitor team collaboration and migration ownership

## Filename Sanitization (v0.3.26)

DBShift v0.3.26 introduces improved filename sanitization to prevent multiple underscores and ensure clean migration filenames.

### Problem Solved
Previous versions generated messy filenames with multiple underscores:
```bash
Input: "test file"  → Generated: 20250623001_jerry__test_.sql  ❌
Input: "test"       → Generated: 20250623001_jerry__test_.sql  ❌
```

### Enhanced Sanitization Logic
```javascript
// New intelligent filename cleaning
const sanitizedName = name
  .toLowerCase()
  .replace(/[^a-zA-Z0-9\-]/g, '_')  // Allow hyphens, convert others to underscore
  .replace(/_{2,}/g, '_')           // Merge consecutive underscores
  .replace(/^_+|_+$/g, '');         // Remove leading/trailing underscores
```

### Clean Results
```bash
Input: "test file"    → Generated: 20250623001_jerry_test_file.sql    ✅
Input: "test"         → Generated: 20250623001_jerry_test.sql         ✅
Input: "test-feature" → Generated: 20250623001_jerry_test-feature.sql ✅
Input: "test  file"   → Generated: 20250623001_jerry_test_file.sql    ✅
```

## Short Parameter Support (v0.3.26)

Enhanced parameter parsing for both CLI and interactive modes with consistent short parameter support.

### Supported Parameter Formats

#### CLI Mode Commands
```bash
# Author parameter variations
dbshiftcli create migration_name -a john          # Short form
dbshiftcli create migration_name --author john    # Long form
dbshiftcli create migration_name --author=john    # Assignment form

# Environment parameter variations  
dbshiftcli history -e production                  # Short form
dbshiftcli history --env production               # Long form
dbshiftcli history --env=production               # Assignment form
```

#### Interactive Mode Commands
```bash
# Author parameter variations (NEW in v0.3.26)
/create migration_name -a john                    # Short form ✨ NEW
/create migration_name --author john              # Long form
/create migration_name --author=john              # Assignment form

# Environment parameter variations
/history -e production                            # Short form
/history --env production                         # Long form
/history --env=production                         # Assignment form
```

### Technical Implementation
```javascript
parseAuthorFromArgs(args) {
  // Enhanced to support both long and short parameters
  const authorIndex = args.findIndex(arg => 
    arg.startsWith('--author') || arg === '-a'
  );
  
  if (authorIndex !== -1) {
    if (args[authorIndex].includes('=')) {
      return args[authorIndex].split('=')[1];
    } else if (args[authorIndex + 1]) {
      return args[authorIndex + 1];
    }
  }
  return 'Admin';
}
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

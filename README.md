# DBShift

A simple and powerful MySQL database migration tool inspired by Flyway.

✨ **New in v0.2.4**: Interactive mode for better user experience!

## 🚀 Quick Start

### Installation

```bash
npm install -g dbshift
```

### Usage

DBShift offers two modes to suit different use cases:

#### 🎨 Interactive Mode (Recommended for beginners)

```bash
# Start interactive mode
dbshift

# Then use commands like:
# /init          - Initialize new project
# /create        - Create new migration
# /migrate       - Run migrations
# /status        - Check migration status
# /config        - Configuration management
# /ping          - Test database connection
# /              - Show all available commands
# q              - Quit
```

#### ⚡ CLI Mode (Great for automation and scripts)

```bash
# Direct commands
dbshiftcli init
dbshiftcli create create_users_table
dbshiftcli migrate
dbshiftcli status
dbshiftcli config
dbshiftcli ping
```

## 📋 Commands

### Interactive Mode Commands

When you run `dbshift`, you enter interactive mode where you can use these commands:

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

### CLI Mode Commands

For automation and scripting, use the `dbshiftcli` command:

### `dbshiftcli init`
Initialize schema migration in the current directory. This creates:
- `migrations/` directory for SQL files
- Configuration file (`.env` or `schema.config.js`)
- Example migration file

### `dbshiftcli migrate [options]`
Run pending migrations in order.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshiftcli status [options]`
Show the status of all migrations (completed, pending, failed).

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshiftcli create <name> [options]`
Create a new migration file with proper naming convention.

Options:
- `-a, --author <author>` - Specify author name (default: Admin)

### `dbshiftcli config [options]`
Show current database configuration.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshiftcli config-init [options]`
Interactive database configuration setup wizard.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshiftcli config-set [options]`
Set database configuration values directly from command line.

Options:
- `-e, --env <environment>` - Specify environment (default: development)
- `--host <host>` - Database host
- `--port <port>` - Database port
- `--user <user>` - Database username
- `--password <password>` - Database password

### `dbshiftcli ping [options]`
Test database connection quickly and efficiently.

Options:
- `-e, --env <environment>` - Specify environment (default: development)
- `--host <host>` - Database host (temporary test, not saved)
- `--port <port>` - Database port (temporary test, not saved)
- `--user <user>` - Database username (temporary test, not saved)
- `--password <password>` - Database password (temporary test, not saved)

Examples:
```bash
# Test current configuration
dbshift ping

# Test production environment
dbshift ping -e production

# Test custom connection (without saving)
dbshift ping --host=localhost --user=root --password=123456
```

## 📁 Project Structure

```
your-project/
├── migrations/
│   ├── 20241220001_Admin_create_users_table.sql
│   ├── 20241220002_Admin_add_indexes.sql
│   └── ...
├── .env                 # Simple configuration
└── schema.config.js     # Advanced configuration (optional)
```

## 🔧 Configuration Management

DBShift provides flexible configuration management with multiple commands:

### Quick Configuration Examples

#### Interactive Mode (Easy for beginners)
```bash
# Start interactive mode
dbshift

# Use configuration commands:
/config                    # Enter configuration menu
/config show              # Show current configuration  
/config init              # Interactive setup
/ping                     # Test connection
```

#### CLI Mode (Great for automation)
```bash
# Show current configuration
dbshiftcli config                                    # Development environment
dbshiftcli config -e production                      # Production environment

# Interactive setup (recommended for first-time setup)
dbshiftcli config-init                               # Create new configuration
dbshiftcli config-init -e production                 # Setup production environment

# Direct configuration (good for scripts and CI/CD)
dbshiftcli config-set --host=localhost --user=root --password=123456
dbshiftcli config-set --host=prod-server --user=prod-user -e production
dbshiftcli config-set --port=3307                    # Update single value

# Test database connection
dbshiftcli ping                                      # Test current configuration
dbshiftcli ping -e production                       # Test production environment
dbshiftcli ping --host=testhost --user=testuser     # Quick connection test
```

### Configuration Workflow

#### For New Users (Interactive Mode)
1. **Start Interactive Mode**: Run `dbshift`
2. **Setup Configuration**: Use `/config init` for guided setup
3. **Test Connection**: Use `/ping` to verify connectivity
4. **Start Using**: Use `/init`, `/create`, `/migrate` commands

#### For Advanced Users (CLI Mode)
1. **First Time Setup**: Use `dbshiftcli config-init` for interactive configuration
2. **Test Connection**: Use `dbshiftcli ping` to verify database connectivity
3. **View Current Settings**: Use `dbshiftcli config` to see current configuration
4. **Quick Updates**: Use `dbshiftcli config-set` to change specific values
5. **Multiple Environments**: Use `-e` flag to manage different environments

## ⚙️ Configuration

### Simple Configuration (.env)

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password
```

### Advanced Configuration (schema.config.js)

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

## 📝 Migration Files

Migration files follow a strict naming convention:
`YYYYMMDDNN_Author_description.sql`

- `YYYYMMDDNN`: Version (Year-Month-Day + sequence)
- `Author`: Author name
- `description`: Brief description

### 🔢 Author-Based Sequence Numbering

DBShift v0.2.1+ uses **author-based sequence numbering** to prevent conflicts in team collaboration:

**Traditional Problem:**
```
20250621001_Alice_create_users.sql    ← Alice creates first
20250621002_Bob_create_posts.sql      ← Bob creates second  
20250621003_Alice_add_index.sql       ← Conflict! Alice can't use 003
```

**DBShift Solution:**
```
20250621001_Alice_create_users.sql    ← Alice: sequence 01
20250621001_Bob_create_posts.sql      ← Bob: sequence 01 (independent)
20250621002_Alice_add_index.sql       ← Alice: sequence 02 (continues)
20250621002_Bob_add_comments.sql      ← Bob: sequence 02 (independent)
```

**Benefits:**
- ✅ **No Conflicts**: Each author has independent sequence numbering
- ✅ **Team Friendly**: Multiple developers can work simultaneously
- ✅ **Clear Ownership**: Easy to identify who created which migration
- ✅ **Merge Safe**: Git merges work smoothly without sequence conflicts

### Example Migration

DBShift uses standard SQL syntax that can be executed in any SQL editor:

```sql
-- Migration: Create users table
-- Author: Admin
-- Created: 2024-12-20
-- Version: 2024122001

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `my_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE `my_app`;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for better performance
CREATE INDEX `idx_users_email` ON `users` (`email`);
```

**Key Benefits:**
- ✅ **Standard SQL**: Works in MySQL Workbench, phpMyAdmin, command line
- ✅ **No Special Syntax**: Uses standard semicolon (`;`) separators
- ✅ **Universal Compatibility**: Can be executed anywhere

## 🔧 Features

### Core Migration Features
- **🔢 Author-Based Sequence Numbering**: Independent sequence numbering per author prevents team collaboration conflicts
- **📝 Standard SQL Syntax**: Compatible with any SQL editor (MySQL Workbench, phpMyAdmin, etc.)
- **🔄 Retry Mechanism**: Failed migrations can be safely re-executed with automatic state management
- **📊 Status Tracking**: Complete migration history with execution timestamps
- **🎯 Template System**: Auto-generated migration templates for different use cases

### Configuration & Setup
- **⚡ Simple Setup**: Initialize with one command
- **⚙️ Flexible Configuration**: Support for `.env` and `schema.config.js` formats
- **🎮 Interactive Setup**: Easy database configuration wizard
- **🤖 Command-line Configuration**: Direct config updates for automation and CI/CD
- **🌍 Multiple Environments**: Support for development/staging/production configs

### Developer Experience
- **👥 Team Friendly**: No sequence conflicts in multi-developer environments
- **🔍 Clear Error Messages**: Detailed error information with solution suggestions
- **🎨 Colored Output**: Beautiful CLI interface with progress indicators
- **📋 Flyway Compatible**: Similar workflow and concepts to Flyway
- **🚀 CI/CD Ready**: GitHub Actions integration with automated testing and publishing

## 📊 Migration Status

The tool tracks migration status in the `dbshift.migration_history` table:
- ✅ **Completed**: Migration executed successfully (status=1)
- ⏳ **Pending**: Migration not yet executed (status=0)
- 🔄 **Retry Safe**: Failed migrations can be safely retried

### Migration History Table Structure
- Unique constraint on `(version, author)` prevents duplicates
- `create_date`: When migration was first attempted
- `modify_date`: Last execution/update time
- Failed migrations keep `status=0` and update `modify_date` on retry

## 🛠 Development

```bash
# Clone the repository
git clone https://github.com/greddy7574/dbshift.git
cd dbshift

# Install dependencies
npm install

# Run tests
npm test
npm run test:coverage

# Test locally
node bin/dbshift.js --help
```

## 🚀 CI/CD & Publishing

### Automated Publishing Workflow

DBShift uses GitHub Actions for automated testing and publishing:

#### 🧪 Continuous Testing
- **Trigger**: Push to `main`/`develop` branches, or Pull Requests
- **Node.js Versions**: 16, 18, 20 (matrix testing)
- **Checks**: Unit tests, code quality, security audit
- **Coverage**: Automated coverage reporting via Codecov

#### 📦 Automated Publishing
- **Trigger**: Push git tags matching `v*` pattern (e.g., `v0.3.0`)
- **Dual Registry**: Publishes to both NPM and GitHub Packages
- **GitHub Release**: Auto-creates release with detailed notes

### Manual Release Process

```bash
# 1. Update version and test
npm version patch  # or minor/major
npm test

# 2. Push with tags to trigger CI/CD
git push origin main --tags

# 3. Monitor GitHub Actions
# Visit: https://github.com/greddy7574/dbshift/actions
```

### Package Installation Options

**NPM Registry (recommended):**
```bash
npm install -g dbshift
```

**GitHub Package Registry:**
```bash
npm install -g @greddy7574/dbshift
```

## ⚠️ Requirements

- Node.js >= 14.0.0
- MySQL database
- npm or yarn

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📚 Version History

### v0.2.1 (Latest)
- 🔢 **Author-Based Sequence Numbering**: Resolves team collaboration conflicts
- 📝 **Simplified SQL Processing**: Standard SQL syntax compatible with any editor
- 🧪 **Enhanced Testing**: Comprehensive test coverage for new features
- 📖 **Documentation Updates**: Complete guides and API documentation

### v0.2.0
- ⚙️ **Configuration Management**: `config`, `config-init`, `config-set` commands
- 🌍 **Multi-Environment Support**: Development, staging, production configs
- 🔄 **Retry Mechanism**: Safe re-execution of failed migrations
- 🚀 **CI/CD Integration**: GitHub Actions automated testing and publishing

### v0.1.x
- 📦 **Initial Release**: Basic migration functionality
- 🎯 **Core Commands**: `init`, `migrate`, `status`, `create`
- 💾 **Database Tracking**: Migration history table
- 📁 **Project Structure**: Standard migration file organization

## 🆚 Comparison with Flyway

| Feature | DBShift | Flyway |
|---------|-------------|---------|
| Language | Node.js | Java |
| Database | MySQL (PostgreSQL planned) | Multiple databases |
| Setup | `npm install -g dbshift` | Java + Flyway installation |
| Configuration | `.env` or `schema.config.js` | `flyway.conf` properties |
| Team Collaboration | Author-based sequence numbering | Global sequence numbering |
| SQL Compatibility | Standard SQL (any editor) | Flyway-specific syntax |
| Learning Curve | Simple | Moderate |
| CI/CD Integration | GitHub Actions built-in | Manual setup |

## 🚀 Roadmap

### Short Term (v0.3.x)
- [ ] PostgreSQL support
- [ ] Migration rollback functionality
- [ ] Dry run mode for safe testing
- [ ] Migration validation and linting

### Medium Term (v0.4.x+)
- [ ] Web UI for migration management
- [ ] Database diff and schema comparison
- [ ] Automated migration generation
- [ ] Integration with popular ORMs

### Long Term
- [ ] Multi-database support (MongoDB, SQLite)
- [ ] Cloud deployment templates
- [ ] Enterprise features and SSO
- [ ] Migration analytics and reporting

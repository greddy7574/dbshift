# DBShift

A simple and powerful MySQL database migration tool inspired by Flyway.

## 🚀 Quick Start

### Installation

```bash
npm install -g dbshift
```

### Usage

```bash
# Initialize a new project
dbshift init

# Create a new migration
dbshift create create_users_table

# Run migrations
dbshift migrate

# Check migration status
dbshift status

# Show current configuration
dbshift config

# Setup configuration interactively
dbshift config-init

# Set configuration directly
dbshift config-set --host=localhost --user=root --password=123456
```

## 📋 Commands

### `dbshift init`
Initialize schema migration in the current directory. This creates:
- `migrations/` directory for SQL files
- Configuration file (`.env` or `schema.config.js`)
- Example migration file

### `dbshift migrate [options]`
Run pending migrations in order.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshift status [options]`
Show the status of all migrations (completed, pending, failed).

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshift create <name> [options]`
Create a new migration file with proper naming convention.

Options:
- `-a, --author <author>` - Specify author name (default: Admin)

### `dbshift config [options]`
Show current database configuration.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshift config-init [options]`
Interactive database configuration setup wizard.

Options:
- `-e, --env <environment>` - Specify environment (default: development)

### `dbshift config-set [options]`
Set database configuration values directly from command line.

Options:
- `-e, --env <environment>` - Specify environment (default: development)
- `--host <host>` - Database host
- `--port <port>` - Database port
- `--user <user>` - Database username
- `--password <password>` - Database password

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

```bash
# Show current configuration
dbshift config                                    # Development environment
dbshift config -e production                      # Production environment

# Interactive setup (recommended for first-time setup)
dbshift config-init                               # Create new configuration
dbshift config-init -e production                 # Setup production environment

# Direct configuration (good for scripts and CI/CD)
dbshift config-set --host=localhost --user=root --password=123456
dbshift config-set --host=prod-server --user=prod-user -e production
dbshift config-set --port=3307                    # Update single value
```

### Configuration Workflow

1. **First Time Setup**: Use `dbshift config-init` for interactive configuration
2. **View Current Settings**: Use `dbshift config` to see current configuration
3. **Quick Updates**: Use `dbshift config-set` to change specific values
4. **Multiple Environments**: Use `-e` flag to manage different environments

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

### Example Migration

```sql
-- Migration: Create users table
-- Author: Admin
-- Created: 2024-12-20
-- Version: 2024122001

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `my_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;;

-- Use the database
USE `my_app`;;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;;

-- Add index for better performance
CREATE INDEX `idx_users_email` ON `users` (`email`);;
```

## 🔧 Features

- **Simple Setup**: Initialize with one command
- **Flexible Configuration**: Multiple ways to manage database settings
- **Interactive Setup**: Easy database configuration wizard
- **Command-line Configuration**: Direct config updates for automation
- **Multiple Environments**: Support for dev/staging/prod configs
- **Template System**: Auto-generated migration templates
- **Status Tracking**: See which migrations are completed
- **Retry Mechanism**: Failed migrations can be safely re-executed
- **Error Handling**: Clear error messages and suggestions
- **Flyway Compatible**: Similar workflow to Flyway

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

# Test locally
node bin/schema.js --help
```

## 📦 Publishing to NPM

```bash
# Build and test
npm run test

# Publish
npm publish
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

## 🆚 Comparison with Flyway

| Feature | DBShift | Flyway |
|---------|-------------|---------|
| Language | Node.js | Java |
| Database | MySQL | Multiple |
| Setup | npm install | Java installation |
| Configuration | .env or .js | Properties file |
| Learning Curve | Simple | Moderate |

## 🚀 Roadmap

- [ ] PostgreSQL support
- [ ] Migration rollback
- [ ] Dry run mode
- [ ] Migration validation
- [ ] Team collaboration features
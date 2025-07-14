# DBShift

<div align="center">

![DBShift Logo](https://img.shields.io/badge/DBShift-MySQL%20Migration%20Tool-blue?style=for-the-badge)
[![npm version](https://img.shields.io/npm/v/dbshift.svg?style=flat-square)](https://www.npmjs.com/package/dbshift)
[![npm downloads](https://img.shields.io/npm/dm/dbshift.svg?style=flat-square)](https://www.npmjs.com/package/dbshift)
[![GitHub stars](https://img.shields.io/github/stars/greddy7574/dbshift.svg?style=flat-square)](https://github.com/greddy7574/dbshift)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A modern, intuitive MySQL database migration tool with dual-mode architecture**

*Inspired by Flyway but built for the modern development workflow*

[🚀 Quick Start](#quick-start) • [📖 Documentation](#documentation) • [💡 Examples](#usage-examples) • [🛠️ Development](#development)

</div>

---

## Overview

DBShift is a powerful MySQL database migration tool that combines the simplicity of traditional CLI tools with a modern, interactive terminal UI. Built with Node.js and featuring innovative dual-mode architecture, it provides an exceptional developer experience for both beginners and advanced users.

### ✨ Key Features

- **🎯 Dual-Mode Architecture**: Choose between interactive mode (React + Ink UI) or traditional CLI
- **⚡ Instant Auto-completion**: Type `/` to see all commands instantly, with smart filtering
- **🔄 Perfect Session Persistence**: All commands return to prompt - never lose your workflow
- **🔢 Author-Based Sequencing**: Independent sequence numbering per developer prevents team conflicts
- **📜 Rich History Tracking**: Detailed migration execution history with author filtering
- **⚙️ Flexible Configuration**: Support for both `.env` and multi-environment configs
- **🏓 Connection Testing**: Built-in database connectivity testing with temporary parameters
- **🌍 Multi-Environment**: Seamless development, staging, and production environment management

### 🏆 Why Choose DBShift?

| Feature | DBShift | Traditional Tools |
|---------|---------|-------------------|
| **User Experience** | Modern terminal UI with instant feedback | Command-line only |
| **Team Collaboration** | Author-based sequencing prevents conflicts | Global sequence causes merge conflicts |
| **Learning Curve** | Visual command discovery, zero memorization | Manual reference required |
| **Workflow** | Session-persistent, continuous workflow | One-shot commands |
| **Configuration** | Multiple formats with environment support | Single configuration file |
| **Error Recovery** | Intelligent retry with state management | Manual intervention required |

---

## Quick Start

### Installation

```bash
# Install globally via npm
npm install -g dbshift

# Or install via GitHub packages
npm install -g @greddy7574/dbshift
```

### Basic Usage

#### 🎨 Interactive Mode (Recommended)

Perfect for daily development work and learning:

```bash
# Start interactive mode
dbshift

# Interactive commands (type these in the prompt):
/                    # 🎯 Show all available commands instantly
/init               # 🚀 Initialize new project with guided setup
/create             # 📝 Create migration with interactive form
/migrate            # ▶️ Execute pending migrations
/status             # 📊 View migration status and history
/history            # 📜 Detailed execution history
/config             # ⚙️ Configuration management
/ping               # 🏓 Test database connection
/exit               # 👋 Exit interactive mode
```

#### ⚡ CLI Mode (Perfect for Automation)

Ideal for scripts, CI/CD, and automation:

```bash
# Project initialization
dbshift -p -- init

# Migration management
dbshift -p -- create "add_users_table" --author=john
dbshift -p -- migrate
dbshift -p -- status

# Configuration management
dbshift -p -- config-set --host=localhost --user=root
dbshift -p -- ping -e production

# History and monitoring
dbshift -p -- history --author=john
```

---

## Usage Examples

### 📚 Complete Workflow Examples

#### Example 1: New Project Setup

```bash
# Start a new project from scratch
dbshift

# In interactive mode:
/init                          # Initialize project structure
# → Creates migrations/ directory and configuration files

/config-init                   # Set up database connection
# → Interactive wizard guides you through setup

/ping                          # Test the connection
# → Verifies database connectivity

/create                        # Create your first migration
# → Name: "create_users_table"
# → Author: "john"
# → Generates: 20250711001_john_create_users_table.sql

/migrate                       # Execute the migration
# → Runs all pending migrations

/status                        # Check migration status
# → Shows completed: 1, pending: 0
```

#### Example 2: Team Development Workflow

```bash
# Alice's work
dbshift -p -- create "create_users_table" --author=alice
# → Generates: 20250711001_alice_create_users_table.sql

# Bob's parallel work (no conflict!)
dbshift -p -- create "create_posts_table" --author=bob  
# → Generates: 20250711001_bob_create_posts_table.sql

# Alice continues
dbshift -p -- create "add_user_indexes" --author=alice
# → Generates: 20250711002_alice_add_user_indexes.sql

# Both can migrate safely
dbshift -p -- migrate
# → Executes all migrations in order
```

#### Example 3: Multi-Environment Deployment

```bash
# Development environment
dbshift -p -- config-set --host=dev-db --user=dev_user -e development
dbshift -p -- migrate -e development

# Staging environment  
dbshift -p -- config-set --host=staging-db --user=staging_user -e staging
dbshift -p -- migrate -e staging

# Production environment
dbshift -p -- config-set --host=prod-db --user=prod_user -e production
dbshift -p -- migrate -e production

# Check status across environments
dbshift -p -- status -e development
dbshift -p -- status -e staging  
dbshift -p -- status -e production
```

#### Example 4: Migration History and Monitoring

```bash
# View complete migration history
dbshift -p -- history

# Filter by specific author
dbshift -p -- history --author=alice

# Check production history
dbshift -p -- history -e production

# Interactive mode for detailed exploration
dbshift
/history                       # View all executions
/history --author=bob          # Filter by author
/status                        # Current status overview
```

### 🔧 Configuration Examples

#### Simple Configuration (`.env`)

```env
# Database connection settings
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=your_app_db
```

#### Advanced Multi-Environment Configuration (`schema.config.js`)

```javascript
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'dev_user',
    password: 'dev_password',
    database: 'myapp_development'
  },
  
  staging: {
    host: 'staging-server.example.com',
    port: 3306,
    user: 'staging_user',
    password: process.env.STAGING_DB_PASSWORD,
    database: 'myapp_staging'
  },
  
  production: {
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT || 3306,
    user: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME
  }
};
```

### 📝 Migration File Examples

#### Basic Table Creation

```sql
-- Migration: Create users table
-- Author: john
-- Date: 2025-07-11

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Complex Schema Changes

```sql
-- Migration: Add user profiles and relationships
-- Author: alice
-- Date: 2025-07-11

-- Create user profiles table
CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to existing users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified_at TIMESTAMP NULL,
ADD COLUMN last_login_at TIMESTAMP NULL;

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_last_login ON users(last_login_at);
```

### 🤖 CI/CD Integration Examples

#### GitHub Actions Workflow

```yaml
name: Database Migration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root_password
          MYSQL_DATABASE: test_db
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install DBShift
      run: npm install -g dbshift
    
    - name: Configure Database
      run: |
        dbshift -p -- config-set \
          --host=127.0.0.1 \
          --user=root \
          --password=root_password \
          --database=test_db
    
    - name: Test Database Connection
      run: dbshift -p -- ping
    
    - name: Run Migrations
      run: dbshift -p -- migrate
    
    - name: Verify Migration Status
      run: dbshift -p -- status
```

#### Docker Integration

```dockerfile
FROM node:18-alpine

# Install DBShift
RUN npm install -g dbshift

# Copy migration files
COPY migrations/ /app/migrations/
COPY schema.config.js /app/
WORKDIR /app

# Migration entrypoint
ENTRYPOINT ["dbshift", "-p", "--"]
CMD ["migrate"]
```

```bash
# Build and run migrations
docker build -t my-app-migrations .
docker run --rm \
  -e PROD_DB_HOST=production-db.example.com \
  -e PROD_DB_USER=prod_user \
  -e PROD_DB_PASSWORD=secure_password \
  my-app-migrations migrate -e production
```

---

## Documentation

### 📋 Command Reference

#### Interactive Mode Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/` | Show all available commands instantly | `/` |
| `/init` | Initialize new project with guided setup | `/init` |
| `/create` | Create migration with interactive form | `/create` |
| `/migrate` | Execute pending migrations | `/migrate -e production` |
| `/status` | View migration status and statistics | `/status` |
| `/history` | Show detailed execution history | `/history --author=john` |
| `/config` | Configuration management menu | `/config` |
| `/config-init` | Interactive configuration wizard | `/config-init` |
| `/config-set` | Direct configuration editor | `/config-set` |
| `/ping` | Test database connection | `/ping --host=testdb` |
| `/about` | Show version and system information | `/about` |
| `/help` | Display help information | `/help` |
| `/exit` | Exit interactive mode | `/exit` |

#### CLI Mode Commands

| Command | Description | Options |
|---------|-------------|---------|
| `init` | Initialize project structure | - |
| `create <name>` | Create new migration file | `-a, --author` |
| `migrate` | Execute pending migrations | `-e, --env` |
| `status` | Show migration status | `-e, --env` |
| `history` | Show execution history | `-e, --env`, `-a, --author` |
| `config` | Display current configuration | `-e, --env` |
| `config-init` | Interactive configuration setup | `-e, --env` |
| `config-set` | Set configuration values | `--host`, `--port`, `--user`, `--password`, `-e, --env` |
| `ping` | Test database connection | `-e, --env`, `--host`, `--port`, `--user`, `--password` |

### 🏗️ Project Structure

After initialization, your project will have this structure:

```
your-project/
├── migrations/                          # Migration SQL files
│   ├── 20250711001_john_create_users.sql
│   ├── 20250711002_john_add_indexes.sql
│   └── 20250711001_alice_create_posts.sql
├── .env                                # Simple configuration
├── schema.config.js                    # Advanced multi-env configuration
└── .dbshift_history                    # Session command history (auto-managed)
```

### 📁 Migration File Naming Convention

**Format**: `YYYYMMDDNN_Author_description.sql`

- **YYYYMMDD**: Date (Year-Month-Day)
- **NN**: Sequence number (per author, per day)
- **Author**: Developer name
- **description**: Brief description (snake_case)

**Examples**:
- `20250711001_john_create_users_table.sql`
- `20250711002_john_add_user_indexes.sql`
- `20250711001_alice_create_posts_table.sql` ← No conflict with John's 001!

### 🔢 Author-Based Sequencing

DBShift's innovative author-based sequencing eliminates team collaboration conflicts:

**Traditional Problem**:
```
20250711001_alice_feature_a.sql    ← Alice commits first
20250711002_bob_feature_b.sql      ← Bob commits second
20250711003_alice_feature_c.sql    ← Merge conflict! 003 already used
```

**DBShift Solution**:
```
20250711001_alice_feature_a.sql    ← Alice: sequence 001
20250711001_bob_feature_b.sql      ← Bob: sequence 001 (independent!)
20250711002_alice_feature_c.sql    ← Alice: sequence 002 (continues)
20250711002_bob_feature_d.sql      ← Bob: sequence 002 (independent!)
```

**Benefits**:
- ✅ Zero merge conflicts on migration file names
- ✅ Independent development workflows
- ✅ Clear author attribution
- ✅ Parallel development support

---

## Development

### 🛠️ Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/greddy7574/dbshift.git
cd dbshift

# Install dependencies
npm install

# Run tests
npm test

# Run test coverage
npm run test:coverage

# Link for local testing
npm link

# Test locally
dbshift --help
dbshift

# Unlink when done
npm unlink -g dbshift
```

### 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### 🏗️ Architecture

DBShift is built with modern technologies:

- **Frontend**: React + Ink for terminal UI
- **CLI**: Commander.js for command parsing
- **Database**: MySQL2 with Promise support
- **Configuration**: dotenv + custom JS configs
- **Testing**: Jest with comprehensive coverage
- **CI/CD**: GitHub Actions with automated publishing

### 📦 Publishing

The project uses automated publishing via GitHub Actions:

```bash
# Update version
npm version patch  # or minor/major

# Push with tags
git push origin main --tags

# GitHub Actions automatically:
# 1. Runs tests on Node.js 16, 18, 20
# 2. Publishes to NPM Registry
# 3. Publishes to GitHub Packages
# 4. Creates GitHub Release
```

---

## Requirements

- **Node.js**: >= 14.0.0
- **Database**: MySQL 5.7+ or 8.0+
- **Package Manager**: npm or yarn

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🤝 How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🐛 Reporting Issues

Please use our [Issue Template](.github/ISSUE_TEMPLATE.md) when reporting bugs or requesting features.

---

## Roadmap

### 🚀 Upcoming Features

- **PostgreSQL Support**: Expand beyond MySQL
- **Migration Rollback**: Safe rollback functionality
- **Dry Run Mode**: Test migrations without execution
- **Web UI**: Browser-based migration management
- **Schema Diff**: Compare database schemas
- **Integration Plugins**: ORM integrations (Sequelize, TypeORM, etc.)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by [Flyway](https://flywaydb.org/) for database migration concepts
- Built with [Ink](https://github.com/vadimdemedes/ink) for beautiful terminal interfaces
- Powered by [MySQL2](https://github.com/sidorares/node-mysql2) for reliable database connectivity

---

<div align="center">

**Made with ❤️ by the DBShift team**

[⭐ Star us on GitHub](https://github.com/greddy7574/dbshift) • [📦 View on NPM](https://www.npmjs.com/package/dbshift) • [📚 Documentation](https://github.com/greddy7574/dbshift/wiki)

</div>
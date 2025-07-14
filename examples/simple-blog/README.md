# Simple Blog Example

This example demonstrates how to use DBShift to manage database migrations for a simple blog application.

## Setup

1. Initialize the migration system:
```bash
# Interactive mode (recommended for beginners)
dbshift
# Then select /init

# CLI mode (suitable for scripts and automation)
dbshift -p -- init
```

2. Configure your database connection:
   - Edit `schema.config.js` to match your database settings
   - For production, use environment variables to override sensitive values

3. Run migrations:
```bash
# Interactive mode
dbshift
# Then select /migrate

# CLI mode - development environment (default)
dbshift -p -- migrate

# CLI mode - specify environment
dbshift -p -- migrate -e production
dbshift -p -- migrate -e test
```

## Configuration

The example uses `schema.config.js` for multi-environment configuration:

```javascript
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_dev_password',
    database: 'blog_dev'
  },
  production: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USERNAME || 'blog_user',
    password: process.env.MYSQL_PASSWORD || 'secure_password',
    database: process.env.MYSQL_DATABASE || 'blog_production'
  }
};
```

### Production Deployment

For production, set environment variables:
```bash
export MYSQL_HOST=your-production-host
export MYSQL_USERNAME=your-production-user
export MYSQL_PASSWORD=your-secure-password
export MYSQL_DATABASE=blog_production

# Then run migrations
dbshift -p -- migrate -e production
```

## Migration Files

The migrations in this example create:

1. **Database and Users table** (`20241220001_Admin_create_users.sql`)
   - Creates the blog database
   - Creates users table with authentication fields

2. **Posts table** (`20241220002_Admin_create_posts.sql`)
   - Creates posts table with foreign key to users
   - Adds indexes for better performance

3. **Comments table** (`20241220003_Admin_create_comments.sql`)
   - Creates comments table with foreign keys
   - Adds composite indexes

## Database Schema

```
blog_db
├── users
│   ├── id (PRIMARY KEY)
│   ├── username (UNIQUE)
│   ├── email (UNIQUE)
│   ├── password_hash
│   └── created_at
├── posts
│   ├── id (PRIMARY KEY)
│   ├── user_id (FOREIGN KEY)
│   ├── title
│   ├── content
│   ├── published
│   └── created_at
└── comments
    ├── id (PRIMARY KEY)
    ├── post_id (FOREIGN KEY)
    ├── user_id (FOREIGN KEY)
    ├── content
    └── created_at
```

## Usage Examples

### Interactive Mode
```bash
# Start interactive mode
dbshift

# Available commands in interactive mode:
# /init     - Initialize project
# /migrate  - Run pending migrations
# /status   - Check migration status
# /history  - View migration history
# /create   - Create new migration
# /config   - Manage configuration
# /ping     - Test database connection
```

### CLI Mode
```bash
# Project initialization
dbshift -p -- init

# Create new migrations
dbshift -p -- create "add_user_profile" --author="yourname"
dbshift -p -- create "add_post_tags" -a "yourname"

# Run migrations
dbshift -p -- migrate
dbshift -p -- migrate -e production

# Check status
dbshift -p -- status
dbshift -p -- status -e production

# View history
dbshift -p -- history
dbshift -p -- history --author="yourname"

# Test connection
dbshift -p -- ping
dbshift -p -- ping -e production
```

## Development Workflow

1. **Create Migration**: Use the create command to generate new migration files
2. **Edit SQL**: Add your SQL statements to the generated file
3. **Test Locally**: Run migrations in development environment
4. **Review Changes**: Check migration status and history
5. **Deploy**: Run migrations in production environment

## File Naming Convention

DBShift uses the following naming pattern for migration files:
```
YYYYMMDDNN_Author_description.sql
```

Examples:
- `20241220001_Admin_create_users.sql`
- `20241220002_Admin_create_posts.sql`
- `20241220001_YourName_add_feature.sql` (same date, different author)

## Author-Grouped Sequencing

DBShift supports author-grouped sequencing to avoid conflicts in team development:
- Each author maintains their own sequence numbers
- Same date + same sequence number is allowed for different authors
- Reduces merge conflicts in collaborative development

## Troubleshooting

### Connection Issues
```bash
# Test your database connection
dbshift -p -- ping

# Test with custom parameters
dbshift -p -- ping --host=localhost --user=root --password=yourpass
```

### Migration Issues
```bash
# Check current status
dbshift -p -- status

# View migration history
dbshift -p -- history

# Check specific environment
dbshift -p -- status -e production
```

### Configuration Issues
```bash
# View current configuration
dbshift -p -- config

# Interactive configuration setup
dbshift -p -- config-init
```

## Best Practices

1. **Environment Separation**: Use different databases for dev/test/prod
2. **Small Migrations**: Keep migrations focused and small
3. **Backup Before Migration**: Always backup production data
4. **Test First**: Test migrations in development before production
5. **Author Identification**: Use consistent author names
6. **Descriptive Names**: Use clear, descriptive migration names

## Contributing

This example demonstrates DBShift's capabilities. To contribute:
1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This example is part of the DBShift project and follows the same MIT license.
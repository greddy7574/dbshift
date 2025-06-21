# Simple Blog Example

This example demonstrates how to use DBShift to manage database migrations for a simple blog application.

## Setup

1. Initialize the migration system:
```bash
dbshift init
```

2. Configure your database connection (edit `.env` or `schema.config.js`)

3. Run migrations:
```bash
dbshift migrate
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
# Development Guide

## Project Structure

```
dbshift/
├── bin/
│   └── dbshift.js          # CLI entry point
├── lib/
│   ├── commands/           # CLI command implementations
│   │   ├── init.js
│   │   ├── migrate.js
│   │   ├── status.js
│   │   ├── create.js
│   │   └── config.js
│   ├── core/              # Core business logic
│   │   ├── config.js      # Configuration management
│   │   ├── database.js    # Database operations
│   │   └── migration.js   # Migration management
│   ├── utils/             # Utility functions
│   │   ├── logger.js      # Logging utilities
│   │   ├── fileUtils.js   # File operations
│   │   └── validator.js   # Input validation
│   └── templates/         # File templates
├── test/                  # Jest tests
├── examples/              # Example projects
└── docs/                  # Documentation
```

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Test CLI locally: `node bin/dbshift.js --help`

## Adding New Features

### Adding a New Command

1. Create command file in `lib/commands/`
2. Add command to `bin/dbshift.js`
3. Add tests in `test/commands/`
4. Update documentation

### Adding Utility Functions

1. Create utility file in `lib/utils/`
2. Add comprehensive tests
3. Export from utility module

## Testing

- Unit tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

## Code Style

- Use async/await for asynchronous operations
- Prefer const/let over var
- Use descriptive variable names
- Add JSDoc comments for public methods
- Follow existing error handling patterns

## Release Process

1. Update version: `npm version patch|minor|major`
2. Run tests: `npm test`
3. Build and test locally
4. Publish: `npm publish`

## Architecture Decisions

### Database Connection
- Uses mysql2/promise for async operations
- Single connection per migration run
- Proper connection cleanup

### Error Handling
- Centralized logging through Logger utility
- Detailed error messages with suggestions
- Graceful failure with proper exit codes

### File Operations
- Centralized file operations through FileUtils
- Proper error handling for file system operations
- Cross-platform compatibility

### Migration Management
- Version-based migration tracking
- Automatic rollback on failure
- Idempotent migration design
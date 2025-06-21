class DBShiftError extends Error {
  constructor(message, code = null, suggestions = []) {
    super(message);
    this.name = 'DBShiftError';
    this.code = code;
    this.suggestions = suggestions;
  }
}

class DatabaseError extends DBShiftError {
  constructor(message, originalError = null) {
    const suggestions = [];
    
    if (originalError) {
      switch (originalError.code) {
        case 'ECONNREFUSED':
          suggestions.push('Make sure MySQL server is running');
          suggestions.push('Check if the host and port are correct');
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          suggestions.push('Verify your username and password');
          suggestions.push('Make sure the user has proper permissions');
          break;
        case 'ER_BAD_DB_ERROR':
          suggestions.push('Make sure the database exists');
          suggestions.push('Check if the database name is correct');
          break;
        case 'ENOTFOUND':
          suggestions.push('Check if the database host is reachable');
          suggestions.push('Verify your network connection');
          break;
      }
    }

    super(message, originalError?.code, suggestions);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class ConfigurationError extends DBShiftError {
  constructor(message, missingFields = []) {
    const suggestions = [];
    
    if (missingFields.length > 0) {
      suggestions.push('Run "dbshift config" to set up database connection');
      suggestions.push('Create a .env file with required database settings');
    }

    super(message, 'CONFIG_ERROR', suggestions);
    this.name = 'ConfigurationError';
    this.missingFields = missingFields;
  }
}

class MigrationError extends DBShiftError {
  constructor(message, migrationFile = null) {
    const suggestions = [];
    
    if (migrationFile) {
      suggestions.push(`Check the SQL syntax in ${migrationFile}`);
      suggestions.push('Make sure all referenced tables exist');
      suggestions.push('Verify that the migration is idempotent');
    }

    super(message, 'MIGRATION_ERROR', suggestions);
    this.name = 'MigrationError';
    this.migrationFile = migrationFile;
  }
}

class ValidationError extends DBShiftError {
  constructor(message, field = null) {
    const suggestions = [];
    
    if (field) {
      suggestions.push(`Check the format of the ${field} field`);
    }

    super(message, 'VALIDATION_ERROR', suggestions);
    this.name = 'ValidationError';
    this.field = field;
  }
}

module.exports = {
  DBShiftError,
  DatabaseError,
  ConfigurationError,
  MigrationError,
  ValidationError
};
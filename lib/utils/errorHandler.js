const Logger = require('./logger');
const { DBShiftError } = require('./errors');

class ErrorHandler {
  static handle(error) {
    if (error instanceof DBShiftError) {
      Logger.crossmark(error.message);
      
      if (error.suggestions && error.suggestions.length > 0) {
        Logger.info('\n💡 Suggestions:');
        error.suggestions.forEach(suggestion => {
          Logger.bullet(suggestion);
        });
      }
      
      return this.getExitCode(error);
    }

    // Handle unexpected errors
    Logger.crossmark(`Unexpected error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    
    return 1;
  }

  static getExitCode(error) {
    switch (error.name) {
      case 'ConfigurationError':
        return 2;
      case 'DatabaseError':
        return 3;
      case 'MigrationError':
        return 4;
      case 'ValidationError':
        return 5;
      default:
        return 1;
    }
  }

  static async executeWithErrorHandling(fn) {
    try {
      await fn();
      process.exit(0);
    } catch (error) {
      const exitCode = this.handle(error);
      process.exit(exitCode);
    }
  }
}

module.exports = ErrorHandler;
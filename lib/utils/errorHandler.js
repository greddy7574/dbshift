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
      // 在交互模式下不退出进程，成功执行直接返回
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(0);
      }
      // 交互模式下成功执行，直接返回不退出
    } catch (error) {
      const exitCode = this.handle(error);
      if (!process.env.DBSHIFT_INTERACTIVE_MODE) {
        process.exit(exitCode);
      } else {
        throw error; // 抛出错误供交互模式处理
      }
    }
  }
}

module.exports = ErrorHandler;
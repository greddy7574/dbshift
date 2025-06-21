const { ConfigurationError, ValidationError } = require('./errors');

class Validator {
  static validateConfig(config) {
    const required = ['host', 'user', 'password'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required configuration: ${missing.join(', ')}`,
        missing
      );
    }

    return true;
  }

  static validateMigrationName(name) {
    // 检查名称是否包含特殊字符
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new ValidationError(
        'Migration name can only contain letters, numbers, and underscores',
        'migration_name'
      );
    }

    // 检查长度
    if (name.length < 3 || name.length > 50) {
      throw new ValidationError(
        'Migration name must be between 3 and 50 characters',
        'migration_name'
      );
    }

    return true;
  }

  static validateAuthorName(author) {
    if (!/^[a-zA-Z0-9_]+$/.test(author)) {
      throw new ValidationError(
        'Author name can only contain letters, numbers, and underscores',
        'author_name'
      );
    }

    if (author.length > 20) {
      throw new ValidationError(
        'Author name must be 20 characters or less',
        'author_name'
      );
    }

    return true;
  }

  static validateDatabaseConnection(config) {
    // 验证主机名
    if (!config.host || typeof config.host !== 'string') {
      throw new ValidationError('Invalid database host', 'host');
    }

    // 验证端口
    const port = parseInt(config.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new ValidationError('Invalid database port', 'port');
    }

    // 验证用户名
    if (!config.user || typeof config.user !== 'string') {
      throw new ValidationError('Invalid database user', 'user');
    }

    return true;
  }
}

module.exports = Validator;
const path = require('path');
const dotenv = require('dotenv');
const Logger = require('../utils/logger');
const FileUtils = require('../utils/fileUtils');
const Validator = require('../utils/validator');

class Config {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = null;
  }

  load() {
    // 尝试加载 schema.config.js
    const configPath = path.join(process.cwd(), 'schema.config.js');
    if (FileUtils.exists(configPath)) {
      try {
        const configModule = require(configPath);
        this.config = configModule[this.environment] || configModule.default || configModule;
        Logger.checkmark(`Loaded config from schema.config.js [${this.environment}]`);
        return this.config;
      } catch (error) {
        Logger.warning(`⚠ Failed to load schema.config.js: ${error.message}`);
      }
    }

    // 回退到 .env 文件
    const envFile = this.environment === 'development' ? '.env' : `.env.${this.environment}`;
    const envPath = path.join(process.cwd(), envFile);
    
    if (FileUtils.exists(envPath)) {
      dotenv.config({ path: envPath });
      this.config = {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USERNAME || 'root',
        port: process.env.MYSQL_PORT || 3306,
        password: process.env.MYSQL_PASSWORD || ''
      };
      Logger.checkmark(`Loaded config from ${envFile}`);
      return this.config;
    }

    Logger.crossmark('No configuration found. Run "dbshift init" to create configuration.');
    return null;
  }

  validate() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    return Validator.validateConfig(this.config);
  }

  get() {
    return this.config;
  }
}

module.exports = Config;
const { useState, useCallback } = require('react');
const fs = require('fs');
const path = require('path');

const useProjectStatus = () => {
  const [projectStatus, setProjectStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const checkConfiguration = useCallback(() => {
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), 'schema.config.js');
    
    return {
      hasEnv: fs.existsSync(envPath),
      hasConfig: fs.existsSync(configPath),
      hasConfig: fs.existsSync(envPath) || fs.existsSync(configPath)
    };
  }, []);

  const checkMigrationsDirectory = useCallback(() => {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      return {
        exists: false,
        totalMigrations: 0,
        migrationFiles: []
      };
    }

    try {
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return {
        exists: true,
        totalMigrations: files.length,
        migrationFiles: files
      };
    } catch (error) {
      return {
        exists: false,
        totalMigrations: 0,
        migrationFiles: [],
        error: error.message
      };
    }
  }, []);

  const testConnection = useCallback(async () => {
    try {
      // 这里应该使用实际的数据库连接测试
      // 暂时返回模拟数据
      const configStatus = checkConfiguration();
      
      if (!configStatus.hasConfig) {
        return { connected: false, reason: 'No configuration found' };
      }

      // TODO: 实际的数据库连接测试
      // const Database = require('../../core/database');
      // const Config = require('../../core/config');
      // const config = Config.load();
      // const db = new Database(config);
      // await db.testConnection();
      
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }, [checkConfiguration]);

  const generateSuggestions = useCallback((status) => {
    const suggestions = [];

    if (!status.hasConfig) {
      suggestions.push({
        command: '/init',
        reason: 'Initialize project configuration',
        priority: 'high'
      });
    }

    if (!status.migrationsDir?.exists) {
      suggestions.push({
        command: '/init',
        reason: 'Create migrations directory',
        priority: 'high'
      });
    }

    if (status.hasConfig && !status.connected) {
      suggestions.push({
        command: '/ping',
        reason: 'Test database connection',
        priority: 'medium'
      });
    }

    if (status.pendingMigrations > 0) {
      suggestions.push({
        command: '/migrate',
        reason: `Apply ${status.pendingMigrations} pending migrations`,
        priority: 'medium'
      });
    }

    if (status.connected && status.pendingMigrations === 0) {
      suggestions.push({
        command: '/create',
        reason: 'Create a new migration',
        priority: 'low'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const configStatus = checkConfiguration();
      const migrationsStatus = checkMigrationsDirectory();
      const connectionStatus = await testConnection();
      
      // TODO: 检查待执行的迁移数量
      // 这需要连接数据库查询 migration_history 表
      const pendingMigrations = migrationsStatus.totalMigrations; // 暂时假设所有都是待执行的
      
      const status = {
        hasConfig: configStatus.hasConfig,
        migrationsDir: migrationsStatus,
        connected: connectionStatus.connected,
        connectionReason: connectionStatus.reason,
        totalMigrations: migrationsStatus.totalMigrations,
        pendingMigrations: pendingMigrations,
        projectPath: process.cwd(),
        environment: process.env.NODE_ENV || 'development',
        lastRefresh: new Date()
      };

      // 生成智能建议
      status.suggestions = generateSuggestions(status);

      setProjectStatus(status);
      return status;
    } catch (error) {
      const errorStatus = {
        hasConfig: false,
        connected: false,
        error: error.message,
        lastRefresh: new Date()
      };
      
      setProjectStatus(errorStatus);
      return errorStatus;
    } finally {
      setIsLoading(false);
    }
  }, [checkConfiguration, checkMigrationsDirectory, testConnection, generateSuggestions]);

  return {
    projectStatus,
    isLoading,
    refreshStatus
  };
};

module.exports = { useProjectStatus };
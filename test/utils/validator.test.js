const Validator = require('../../lib/utils/validator');
const { ConfigurationError, ValidationError } = require('../../lib/utils/errors');

describe('Validator', () => {
  describe('validateConfig', () => {
    test('should validate correct config', () => {
      const config = {
        host: 'localhost',
        user: 'root',
        password: 'password'
      };
      
      expect(() => Validator.validateConfig(config)).not.toThrow();
    });

    test('should throw error for missing required fields', () => {
      const config = {
        host: 'localhost'
        // missing user and password
      };
      
      expect(() => Validator.validateConfig(config))
        .toThrow(ConfigurationError);
    });
  });

  describe('validateMigrationName', () => {
    test('should validate correct migration name', () => {
      expect(() => Validator.validateMigrationName('create_users_table')).not.toThrow();
      expect(() => Validator.validateMigrationName('add_index_123')).not.toThrow();
    });

    test('should throw error for invalid characters', () => {
      expect(() => Validator.validateMigrationName('create-users-table'))
        .toThrow('Migration name can only contain letters, numbers, and underscores');
      
      expect(() => Validator.validateMigrationName('create users table'))
        .toThrow('Migration name can only contain letters, numbers, and underscores');
    });

    test('should throw error for invalid length', () => {
      expect(() => Validator.validateMigrationName('ab'))
        .toThrow('Migration name must be between 3 and 50 characters');
      
      expect(() => Validator.validateMigrationName('a'.repeat(51)))
        .toThrow('Migration name must be between 3 and 50 characters');
    });
  });

  describe('validateAuthorName', () => {
    test('should validate correct author name', () => {
      expect(() => Validator.validateAuthorName('Admin')).not.toThrow();
      expect(() => Validator.validateAuthorName('User123')).not.toThrow();
    });

    test('should throw error for invalid characters', () => {
      expect(() => Validator.validateAuthorName('Admin-User'))
        .toThrow('Author name can only contain letters, numbers, and underscores');
    });

    test('should throw error for too long name', () => {
      expect(() => Validator.validateAuthorName('a'.repeat(21)))
        .toThrow('Author name must be 20 characters or less');
    });
  });

  describe('validateDatabaseConnection', () => {
    test('should validate correct database config', () => {
      const config = {
        host: 'localhost',
        port: 3306,
        user: 'root'
      };
      
      expect(() => Validator.validateDatabaseConnection(config)).not.toThrow();
    });

    test('should throw error for invalid port', () => {
      const config = {
        host: 'localhost',
        port: 'invalid',
        user: 'root'
      };
      
      expect(() => Validator.validateDatabaseConnection(config))
        .toThrow('Invalid database port');
    });

    test('should throw error for missing host', () => {
      const config = {
        port: 3306,
        user: 'root'
      };
      
      expect(() => Validator.validateDatabaseConnection(config))
        .toThrow('Invalid database host');
    });
  });
});
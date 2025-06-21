const ConnectionTester = require('../../lib/utils/connectionTester');
const Database = require('../../lib/core/database');

// Mock Database
jest.mock('../../lib/core/database');

describe('ConnectionTester', () => {
  let mockDatabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to avoid clutter in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockDatabase = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      query: jest.fn()
    };
    
    Database.mockImplementation(() => mockDatabase);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('testConnection', () => {
    test('should successfully test connection', async () => {
      // Setup mocks
      mockDatabase.query
        .mockResolvedValueOnce([{ test_connection: 1, mysql_version: '8.0.28' }])
        .mockResolvedValueOnce([{ server_comment: 'MySQL Community Server' }]);

      const dbConfig = {
        host: 'localhost',
        user: 'root',
        port: 3306,
        password: 'password'
      };

      const result = await ConnectionTester.testConnection(dbConfig, { verbose: false });

      expect(result.success).toBe(true);
      expect(result.mysql_version).toBe('8.0.28');
      expect(result.server_comment).toBe('MySQL Community Server');
      expect(result.timing).toHaveProperty('connect');
      expect(result.timing).toHaveProperty('query');
      expect(result.timing).toHaveProperty('total');
      
      expect(mockDatabase.connect).toHaveBeenCalledTimes(1);
      expect(mockDatabase.disconnect).toHaveBeenCalledTimes(1);
      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
    });

    test('should handle connection failure', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      mockDatabase.connect.mockRejectedValue(connectionError);

      const dbConfig = {
        host: 'invalid-host',
        user: 'root',
        port: 3306,
        password: 'password'
      };

      await expect(ConnectionTester.testConnection(dbConfig, { verbose: false }))
        .rejects.toThrow('Connection refused');
    });

    test('should test migration table when requested', async () => {
      // Setup basic connection mocks
      mockDatabase.query
        .mockResolvedValueOnce([{ test_connection: 1, mysql_version: '8.0.28' }])
        .mockResolvedValueOnce([{ server_comment: 'MySQL Community Server' }]);

      // Setup migration table test mocks
      const mockMigrationTableQuery = jest.fn()
        .mockResolvedValueOnce([{ count: 1 }]) // table exists
        .mockResolvedValueOnce([{ total_migrations: 5, completed_migrations: 3, pending_migrations: 2 }]);

      const mockMigrationDatabase = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        query: mockMigrationTableQuery
      };

      // Mock Database constructor to return different instances
      Database.mockImplementationOnce(() => mockDatabase)
             .mockImplementationOnce(() => mockMigrationDatabase);

      const dbConfig = {
        host: 'localhost',
        user: 'root',
        port: 3306,
        password: 'password'
      };

      const result = await ConnectionTester.testConnection(dbConfig, { 
        verbose: false, 
        testMigrationTable: true 
      });

      expect(result.success).toBe(true);
      expect(result.migration).toEqual({
        table_exists: true,
        total_migrations: 5,
        completed_migrations: 3,
        pending_migrations: 2
      });
      
      expect(mockMigrationDatabase.connect).toHaveBeenCalledTimes(1);
      expect(mockMigrationDatabase.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('testMigrationTableAccess', () => {
    test('should handle non-existent migration table', async () => {
      mockDatabase.query.mockResolvedValueOnce([{ count: 0 }]); // table doesn't exist

      const dbConfig = { host: 'localhost', user: 'root' };
      const result = await ConnectionTester.testMigrationTableAccess(dbConfig, false);

      expect(result.table_exists).toBe(false);
      expect(result.total_migrations).toBe(0);
      expect(result.completed_migrations).toBe(0);
      expect(result.pending_migrations).toBe(0);
    });

    test('should get migration statistics when table exists', async () => {
      mockDatabase.query
        .mockResolvedValueOnce([{ count: 1 }]) // table exists
        .mockResolvedValueOnce([{ 
          total_migrations: 10, 
          completed_migrations: 8, 
          pending_migrations: 2 
        }]);

      const dbConfig = { host: 'localhost', user: 'root' };
      const result = await ConnectionTester.testMigrationTableAccess(dbConfig, false);

      expect(result.table_exists).toBe(true);
      expect(result.total_migrations).toBe(10);
      expect(result.completed_migrations).toBe(8);
      expect(result.pending_migrations).toBe(2);
    });
  });

  describe('showTroubleshootingSuggestions', () => {
    test('should show appropriate suggestions for different error types', () => {
      const logSpy = jest.spyOn(console, 'log');
      
      // Test ECONNREFUSED error
      const connRefusedError = new Error('Connection refused');
      connRefusedError.code = 'ECONNREFUSED';
      ConnectionTester.showTroubleshootingSuggestions(connRefusedError);
      
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Check if MySQL server is running'));
      
      // Test ACCESS_DENIED error
      logSpy.mockClear();
      const accessDeniedError = new Error('Access denied');
      accessDeniedError.code = 'ER_ACCESS_DENIED_ERROR';
      ConnectionTester.showTroubleshootingSuggestions(accessDeniedError);
      
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Check username and password'));
    });
  });
});
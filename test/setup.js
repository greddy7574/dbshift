// Test setup and global configuration
jest.setTimeout(30000); // 30 seconds timeout for database operations

// Mock console to suppress logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};
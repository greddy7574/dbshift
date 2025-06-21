const FileUtils = require('../../lib/utils/fileUtils');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');

describe('FileUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exists', () => {
    test('should return true when file exists', () => {
      fs.existsSync.mockReturnValue(true);
      
      expect(FileUtils.exists('/path/to/file')).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file');
    });

    test('should return false when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(FileUtils.exists('/path/to/file')).toBe(false);
    });
  });

  describe('readFile', () => {
    test('should read file content', () => {
      const content = 'file content';
      fs.readFileSync.mockReturnValue(content);
      
      expect(FileUtils.readFile('/path/to/file')).toBe(content);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file', 'utf8');
    });
  });

  describe('generateTimestamp', () => {
    test('should generate timestamp in YYYYMMDD format', () => {
      const mockDate = new Date('2024-03-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      expect(FileUtils.generateTimestamp()).toBe('20240315');
      
      global.Date.mockRestore();
    });
  });

  describe('listFiles', () => {
    test('should return empty array when directory does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(FileUtils.listFiles('/nonexistent')).toEqual([]);
    });

    test('should return all files when no extension specified', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.txt', 'file2.sql', 'file3.js']);
      
      expect(FileUtils.listFiles('/path')).toEqual(['file1.txt', 'file2.sql', 'file3.js']);
    });

    test('should filter files by extension', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.txt', 'file2.sql', 'file3.sql']);
      
      expect(FileUtils.listFiles('/path', '.sql')).toEqual(['file2.sql', 'file3.sql']);
    });
  });

  describe('generateSequence', () => {
    test('should return 01 when no existing files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);
      
      expect(FileUtils.generateSequence('/path', '20240315', 'Admin')).toBe('01');
    });

    test('should increment sequence from existing files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        '2024031501_Admin_test.sql',
        '2024031502_Admin_test2.sql'
      ]);
      
      expect(FileUtils.generateSequence('/path', '20240315', 'Admin')).toBe('03');
    });
  });
});
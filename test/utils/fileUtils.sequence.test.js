const fs = require('fs');
const path = require('path');
const FileUtils = require('../../lib/utils/fileUtils');

describe('FileUtils.generateSequence - Author-based numbering', () => {
  const testDir = path.join(__dirname, '../temp');
  
  beforeEach(() => {
    // 创建测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('should generate sequence 01 for new author', () => {
    const sequence = FileUtils.generateSequence(testDir, '20250621', 'alice');
    expect(sequence).toBe('01');
  });

  test('should generate independent sequences for different authors', () => {
    // 创建Alice的文件
    fs.writeFileSync(path.join(testDir, '20250621001_alice_test1.sql'), '');
    fs.writeFileSync(path.join(testDir, '20250621002_alice_test2.sql'), '');
    
    // 创建Bob的文件
    fs.writeFileSync(path.join(testDir, '20250621001_bob_test1.sql'), '');
    
    // Alice的下一个序号应该是03
    expect(FileUtils.generateSequence(testDir, '20250621', 'alice')).toBe('03');
    
    // Bob的下一个序号应该是02
    expect(FileUtils.generateSequence(testDir, '20250621', 'bob')).toBe('02');
    
    // 新作者Charlie应该从01开始
    expect(FileUtils.generateSequence(testDir, '20250621', 'charlie')).toBe('01');
  });

  test('should handle different dates independently', () => {
    // 创建昨天的文件
    fs.writeFileSync(path.join(testDir, '20250620001_alice_yesterday.sql'), '');
    fs.writeFileSync(path.join(testDir, '20250620002_alice_yesterday2.sql'), '');
    
    // 今天Alice应该从01开始
    expect(FileUtils.generateSequence(testDir, '20250621', 'alice')).toBe('01');
  });

  test('should handle sequence numbers correctly up to 99', () => {
    // 创建Alice的98个文件
    for (let i = 1; i <= 98; i++) {
      const seq = i.toString().padStart(2, '0');
      fs.writeFileSync(path.join(testDir, `20250621${seq}_alice_test${i}.sql`), '');
    }
    
    // 下一个应该是99
    expect(FileUtils.generateSequence(testDir, '20250621', 'alice')).toBe('99');
  });

  test('should ignore files with incorrect naming format', () => {
    // 创建正确格式的文件
    fs.writeFileSync(path.join(testDir, '20250621001_alice_correct.sql'), '');
    
    // 创建错误格式的文件
    fs.writeFileSync(path.join(testDir, 'invalid_format.sql'), '');
    fs.writeFileSync(path.join(testDir, '20250621_no_author.sql'), '');
    fs.writeFileSync(path.join(testDir, '20250621001.sql'), '');
    
    // 应该只考虑正确格式的文件
    expect(FileUtils.generateSequence(testDir, '20250621', 'alice')).toBe('02');
  });
});
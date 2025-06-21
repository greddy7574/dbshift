const fs = require('fs');
const path = require('path');

class FileUtils {
  static exists(filePath) {
    return fs.existsSync(filePath);
  }

  static readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  static writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!this.exists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }

  static ensureDir(dirPath) {
    if (!this.exists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static listFiles(dirPath, extension = null) {
    if (!this.exists(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    
    if (extension) {
      return files.filter(file => file.endsWith(extension)).sort();
    }
    
    return files.sort();
  }

  static generateTimestamp() {
    const now = new Date();
    return now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
  }

  static generateSequence(dirPath, dateStr, author) {
    // 按作者分组生成序号，避免多人协作时的冲突
    const existingFiles = this.listFiles(dirPath, '.sql')
      .filter(file => {
        // 匹配同一天同一作者的文件: YYYYMMDDNN_Author_xxx.sql
        const parts = file.split('_');
        if (parts.length < 2) return false;
        
        const versionPart = parts[0];
        // 检查版本号是否以指定日期开头 (前8位)
        if (!versionPart.startsWith(dateStr)) return false;
        
        // 检查作者是否匹配
        return parts[1] === author;
      })
      .sort();

    if (existingFiles.length === 0) {
      return '01';
    }

    // 找到该作者当天的最大序号
    let maxSequence = 0;
    existingFiles.forEach(file => {
      // 从文件名中提取序号部分 (YYYYMMDDNN的最后两位)
      const versionPart = file.split('_')[0]; // 获取版本号部分
      const sequence = parseInt(versionPart.substring(versionPart.length - 2)); // 提取最后两位NN
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    });

    return (maxSequence + 1).toString().padStart(2, '0');
  }
}

module.exports = FileUtils;
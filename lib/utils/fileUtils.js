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

  static generateSequence(dirPath, dateStr) {
    const existingFiles = this.listFiles(dirPath, '.sql')
      .filter(file => file.startsWith(dateStr))
      .sort();

    if (existingFiles.length === 0) {
      return '01';
    }

    const lastFile = existingFiles[existingFiles.length - 1];
    const lastSequence = parseInt(lastFile.substring(8, 10));
    return (lastSequence + 1).toString().padStart(2, '0');
  }
}

module.exports = FileUtils;
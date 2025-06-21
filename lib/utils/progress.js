const Logger = require('./logger');

class ProgressIndicator {
  constructor(total, description = 'Processing') {
    this.total = total;
    this.current = 0;
    this.description = description;
    this.startTime = Date.now();
  }

  start() {
    Logger.info(`${this.description} (${this.total} items)...`);
    this.startTime = Date.now();
  }

  increment(itemName = null) {
    this.current++;
    const percentage = Math.round((this.current / this.total) * 100);
    const progress = this.getProgressBar(percentage);
    
    if (itemName) {
      Logger.step(`[${this.current}/${this.total}] ${itemName}`);
    }
    
    if (this.current === this.total) {
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
      Logger.checkmark(`${this.description} completed in ${duration}s`);
    }
  }

  getProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  static async withProgress(items, description, processor) {
    const progress = new ProgressIndicator(items.length, description);
    progress.start();
    
    const results = [];
    for (const item of items) {
      const result = await processor(item);
      results.push(result);
      progress.increment(item.name || item.toString());
    }
    
    return results;
  }
}

module.exports = ProgressIndicator;
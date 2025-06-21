const chalk = require('chalk');

class Logger {
  static info(message) {
    console.log(chalk.blue(message));
  }

  static success(message) {
    console.log(chalk.green(message));
  }

  static warning(message) {
    console.log(chalk.yellow(message));
  }

  static error(message) {
    console.log(chalk.red(message));
  }

  static gray(message) {
    console.log(chalk.gray(message));
  }

  static step(message) {
    console.log(chalk.blue(`→ ${message}`));
  }

  static checkmark(message) {
    console.log(chalk.green(`✓ ${message}`));
  }

  static crossmark(message) {
    console.log(chalk.red(`✗ ${message}`));
  }

  static bullet(message) {
    console.log(chalk.gray(`  • ${message}`));
  }
}

module.exports = Logger;
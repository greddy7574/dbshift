-- Migration: {{DESCRIPTION}}
-- Author: {{AUTHOR}}
-- Created: {{DATE}}
-- Version: {{VERSION}}

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `{{DATABASE_NAME}}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;;

-- Use the database
USE `{{DATABASE_NAME}}`;;

-- Add your SQL statements here
-- Remember to use ;; to separate multiple statements

-- Example: Create a table
-- CREATE TABLE IF NOT EXISTS `example_table` (
--   `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
--   `name` VARCHAR(255) NOT NULL,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;;

-- Example: Add an index
-- CREATE INDEX `idx_example_name` ON `example_table` (`name`);;
-- Migration: add user index
-- Author: jerry
-- Created: 2025-06-21
-- Version: 20250621001

-- Use the database
USE `my_app`;

-- Create index for better performance
CREATE INDEX `idx_users_username` ON `users` (`username`);
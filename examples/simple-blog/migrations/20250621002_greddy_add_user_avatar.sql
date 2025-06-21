-- Migration: add user avatar
-- Author: greddy
-- Created: 2025-06-21
-- Version: 20250621002

-- Use the database
USE `my_app`;

-- Add avatar column to users table
ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(255) NULL AFTER `email`;
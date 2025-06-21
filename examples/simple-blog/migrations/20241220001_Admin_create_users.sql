-- Migration: Create users table
-- Author: Admin
-- Created: 2024-12-20
-- Version: 20241220001

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `blog_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;;

-- Use the database
USE `blog_db`;;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;;

-- Add indexes for better performance
CREATE INDEX `idx_users_email` ON `users` (`email`);;
CREATE INDEX `idx_users_username` ON `users` (`username`);;
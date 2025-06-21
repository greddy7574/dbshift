-- Migration: Create posts table
-- Author: Admin
-- Created: 2024-12-20
-- Version: 20241220002

-- Use the blog database
USE `blog_db`;

-- Create posts table
CREATE TABLE IF NOT EXISTS `posts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `published` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes
CREATE INDEX `idx_posts_user_id` ON `posts` (`user_id`);
CREATE INDEX `idx_posts_published` ON `posts` (`published`);
CREATE INDEX `idx_posts_created_at` ON `posts` (`created_at`);
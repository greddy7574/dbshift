-- Migration: Create comments table
-- Author: Admin
-- Created: 2024-12-20
-- Version: 20241220003

-- Use the blog database
USE `blog_db`;

-- Create comments table
CREATE TABLE IF NOT EXISTS `comments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes
CREATE INDEX `idx_comments_post_id` ON `comments` (`post_id`);
CREATE INDEX `idx_comments_user_id` ON `comments` (`user_id`);
CREATE INDEX `idx_comments_created_at` ON `comments` (`created_at`);
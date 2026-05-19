-- =============================================
-- Concept Clarity — Database Setup Script
-- Run this once before starting the application
-- =============================================

-- Create database (Spring Boot will also create it automatically
-- if createDatabaseIfNotExist=true is in the connection URL)
CREATE DATABASE IF NOT EXISTS concept_clarity
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE concept_clarity;

-- The 'concepts' table is auto-created by Hibernate (ddl-auto=update)
-- But you can pre-create it for clarity:

CREATE TABLE IF NOT EXISTS concepts (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    topic       VARCHAR(500)  NOT NULL,
    level       VARCHAR(20)   NOT NULL COMMENT 'BEGINNER | INTERMEDIATE | ADVANCED',
    type        VARCHAR(20)   NOT NULL COMMENT 'DEFINITION | DETAILED | STEP_BY_STEP',
    prompt      TEXT          COMMENT 'The AI prompt that was sent',
    response    TEXT          COMMENT 'Raw JSON response from AI',
    session_id  VARCHAR(100)  COMMENT 'Frontend session identifier',
    success     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_topic      (topic(100)),
    INDEX idx_created_at (created_at),
    INDEX idx_session    (session_id),
    INDEX idx_level      (level),
    INDEX idx_type       (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify
SHOW TABLES;
DESCRIBE concepts;

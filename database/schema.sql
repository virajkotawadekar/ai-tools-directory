-- CREATE DATABASE AND USE IT
CREATE DATABASE IF NOT EXISTS ai_directory;
USE ai_directory;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50) NULL,
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' -- 'user', 'admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TOOLS TABLE
CREATE TABLE IF NOT EXISTS tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    description TEXT NOT NULL,
    logo TEXT NULL, -- HTML/SVG code representation
    website_url VARCHAR(255) NOT NULL,
    pricing VARCHAR(50) NOT NULL, -- 'Free', 'Freemium', 'Paid', 'Free Trial'
    rating DECIMAL(2,1) DEFAULT 0.0,
    monthly_visits VARCHAR(50) DEFAULT '0',
    tags VARCHAR(255) NULL, -- comma separated tags
    status VARCHAR(20) DEFAULT 'pending', -- 'approved', 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tool_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tool_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_tool_slug ON tools (slug);
CREATE INDEX idx_tool_status ON tools (status);
CREATE INDEX idx_category_slug ON categories (slug);
CREATE INDEX idx_review_tool ON reviews (tool_id);

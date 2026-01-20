-- Migration number: 0001 	 2024-12-27T22:04:18.794Z

-- Drop old comments table if it exists
DROP TABLE IF EXISTS comments;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    customer_id INTEGER,
    company_id INTEGER,
    value REAL,
    stage TEXT NOT NULL,
    probability INTEGER,
    expected_close_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    customer_id INTEGER,
    company_id INTEGER,
    deal_id INTEGER,
    due_date DATETIME,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    customer_id INTEGER,
    company_id INTEGER,
    deal_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
);

-- Insert sample companies
INSERT INTO companies (name, industry, website, address, city, state, zip_code, country)
VALUES
    ('Acme Corp', 'Technology', 'https://acme.com', '123 Tech Street', 'San Francisco', 'CA', '94105', 'USA'),
    ('TechStart Inc', 'Software', 'https://techstart.io', '456 Innovation Ave', 'Austin', 'TX', '78701', 'USA'),
    ('Global Solutions', 'Consulting', 'https://globalsolutions.com', '789 Business Blvd', 'New York', 'NY', '10001', 'USA');

-- Insert sample customers
INSERT INTO customers (first_name, last_name, email, phone, company_id)
VALUES
    ('John', 'Smith', 'john.smith@acme.com', '+1-555-0101', 1),
    ('Sarah', 'Johnson', 'sarah.johnson@techstart.io', '+1-555-0202', 2),
    ('Michael', 'Brown', 'michael.brown@globalsolutions.com', '+1-555-0303', 3);

-- Insert sample deals
INSERT INTO deals (title, customer_id, company_id, value, stage, probability, expected_close_date)
VALUES
    ('Enterprise License Agreement', 1, 1, 50000.00, 'negotiation', 75, '2025-03-15'),
    ('Annual Support Contract', 2, 2, 25000.00, 'proposal', 60, '2025-02-28'),
    ('Consulting Engagement', 3, 3, 100000.00, 'closed-won', 100, '2025-01-30');

-- Insert sample activities
INSERT INTO activities (type, subject, customer_id, company_id, deal_id, due_date, status)
VALUES
    ('call', 'Follow-up call on proposal', 1, 1, 1, '2025-01-20 14:00:00', 'pending'),
    ('meeting', 'Product demonstration', 2, 2, 2, '2025-01-18 10:00:00', 'completed'),
    ('email', 'Send contract details', 3, 3, 3, '2025-01-16 09:00:00', 'completed');

-- Insert sample notes
INSERT INTO notes (content, customer_id, company_id, deal_id)
VALUES
    ('Customer showed strong interest in enterprise features. Follow up next week.', 1, 1, 1),
    ('Decision maker is the CTO. Technical requirements are clear.', 2, 2, 2),
    ('Contract signed. Project kickoff scheduled for next month.', 3, 3, 3);

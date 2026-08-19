-- VetCare Pro Super Admin Schema

CREATE TABLE IF NOT EXISTS super_admins (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saas_plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    features TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saas_subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    clinic_id VARCHAR(36),
    clinic_admin_id VARCHAR(36),
    plan_id VARCHAR(36),
    status ENUM('Active', 'Expired', 'Cancelled', 'Trial', 'Pending') DEFAULT 'Trial',
    start_date DATE,
    end_date DATE,
    razorpay_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES Clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_admin_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES saas_plans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS saas_payments (
    id VARCHAR(36) PRIMARY KEY,
    clinic_id VARCHAR(36),
    clinic_admin_id VARCHAR(36),
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Successful', 'Pending', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    invoice_number VARCHAR(255),
    payment_method VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'INR',
    FOREIGN KEY (clinic_id) REFERENCES Clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_admin_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS saas_support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    clinic_id VARCHAR(36),
    clinic_admin_id VARCHAR(36),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Open', 'In Progress', 'Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES Clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_admin_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS saas_system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL
);

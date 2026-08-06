-- Idempotent migration: customers + sales + returns + wholesale pricing.
-- Fresh containers get this from schema.sql; this file applies the same DDL
-- to an already-initialized database.

ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(12,2);

CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    customer_type VARCHAR(20) NOT NULL DEFAULT 'retail',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT customers_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT customers_type_valid CHECK (customer_type IN ('wholesale', 'retail')),
    CONSTRAINT customers_email_format CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE TABLE IF NOT EXISTS sales (
    sale_id SERIAL PRIMARY KEY,
    sale_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(customer_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sales_number_not_empty CHECK (LENGTH(TRIM(sale_number)) > 0),
    CONSTRAINT sales_amounts_positive CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0),
    CONSTRAINT sales_method_valid CHECK (payment_method IN ('cash', 'card', 'split', 'other')),
    CONSTRAINT sales_status_valid CHECK (status IN ('completed', 'partially_refunded', 'refunded'))
);

CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(sale_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    returned_qty INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT sale_items_prices_positive CHECK (unit_price >= 0 AND line_total >= 0),
    CONSTRAINT sale_items_returned_valid CHECK (returned_qty >= 0 AND returned_qty <= quantity)
);

CREATE TABLE IF NOT EXISTS returns (
    return_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(sale_id),
    sale_item_id INTEGER NOT NULL REFERENCES sale_items(sale_item_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    customer_id INTEGER REFERENCES customers(customer_id),
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT returns_quantity_positive CHECK (quantity > 0),
    CONSTRAINT returns_refund_positive CHECK (refund_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);

-- Recreate the customers updated_at trigger idempotently.
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

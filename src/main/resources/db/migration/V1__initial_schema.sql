CREATE TABLE customers (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    address TEXT,
    created_at DATE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE items (
    id VARCHAR(36) NOT NULL,
    type VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    serial VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at DATE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE rentals (
    id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(36),
    rent_amount DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(32) NOT NULL,
    custom_days INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(32) NOT NULL,
    created_at DATE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE payments (
    id VARCHAR(36) NOT NULL,
    rental_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    method VARCHAR(255),
    remarks TEXT,
    created_at DATE NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE rentals ADD CONSTRAINT fk_rentals_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE rentals ADD CONSTRAINT fk_rentals_item FOREIGN KEY (item_id) REFERENCES items(id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_rental FOREIGN KEY (rental_id) REFERENCES rentals(id);

CREATE INDEX idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX idx_rentals_item_id ON rentals(item_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_payments_rental_id ON payments(rental_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_items_brand ON items(brand);

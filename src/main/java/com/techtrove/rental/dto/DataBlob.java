package com.techtrove.rental.dto;

import java.util.List;

public class DataBlob {
    private List<CustomerDto> customers;
    private List<ItemDto> items;
    private List<RentalDto> rentals;
    private List<PaymentDto> payments;

    public List<CustomerDto> getCustomers() { return customers; }
    public void setCustomers(List<CustomerDto> customers) { this.customers = customers; }

    public List<ItemDto> getItems() { return items; }
    public void setItems(List<ItemDto> items) { this.items = items; }

    public List<RentalDto> getRentals() { return rentals; }
    public void setRentals(List<RentalDto> rentals) { this.rentals = rentals; }

    public List<PaymentDto> getPayments() { return payments; }
    public void setPayments(List<PaymentDto> payments) { this.payments = payments; }
}

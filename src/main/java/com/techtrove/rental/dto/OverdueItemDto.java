package com.techtrove.rental.dto;

public class OverdueItemDto {
    private CustomerDto customer;
    private RentalDto rental;
    private RentalStatusDto status;

    public OverdueItemDto(CustomerDto customer, RentalDto rental, RentalStatusDto status) {
        this.customer = customer;
        this.rental = rental;
        this.status = status;
    }

    public CustomerDto getCustomer() { return customer; }
    public RentalDto getRental() { return rental; }
    public RentalStatusDto getStatus() { return status; }
}

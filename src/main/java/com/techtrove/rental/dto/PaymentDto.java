package com.techtrove.rental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PaymentDto {
    private String id;
    @NotBlank
    private String rentalId;
    @NotNull
    private java.math.BigDecimal amount;
    @NotBlank
    private String date;
    @NotBlank
    private String method;
    private String remarks;
    @NotBlank
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRentalId() { return rentalId; }
    public void setRentalId(String rentalId) { this.rentalId = rentalId; }

    public java.math.BigDecimal getAmount() { return amount; }
    public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}

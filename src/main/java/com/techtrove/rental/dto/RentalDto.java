package com.techtrove.rental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RentalDto {
    private String id;
    @NotBlank
    private String customerId;
    @NotBlank
    private String itemId;
    @NotNull
    private java.math.BigDecimal rentAmount;
    @NotBlank
    private String billingCycle;
    private Integer customDays;
    @NotBlank
    private String startDate;
    private String endDate;
    @NotBlank
    private String status;
    @NotBlank
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }

    public java.math.BigDecimal getRentAmount() { return rentAmount; }
    public void setRentAmount(java.math.BigDecimal rentAmount) { this.rentAmount = rentAmount; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public Integer getCustomDays() { return customDays; }
    public void setCustomDays(Integer customDays) { this.customDays = customDays; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}

package com.techtrove.rental.dto;

import java.util.List;

/**
 * Aggregated data for the dashboard screen.
 * Computed server-side from all 4 tables.
 */
public class DashboardDto {
    private long totalCustomers;
    private long activeRentals;
    private long totalItems;
    private java.math.BigDecimal monthlyCollected;
    private java.math.BigDecimal outstandingTotal;
    private List<OverdueItemDto> overdue;
    private List<DueSoonItemDto> dueSoon;

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getActiveRentals() { return activeRentals; }
    public void setActiveRentals(long activeRentals) { this.activeRentals = activeRentals; }

    public long getTotalItems() { return totalItems; }
    public void setTotalItems(long totalItems) { this.totalItems = totalItems; }

    public java.math.BigDecimal getMonthlyCollected() { return monthlyCollected; }
    public void setMonthlyCollected(java.math.BigDecimal monthlyCollected) { this.monthlyCollected = monthlyCollected; }

    public java.math.BigDecimal getOutstandingTotal() { return outstandingTotal; }
    public void setOutstandingTotal(java.math.BigDecimal outstandingTotal) { this.outstandingTotal = outstandingTotal; }

    public List<OverdueItemDto> getOverdue() { return overdue; }
    public void setOverdue(List<OverdueItemDto> overdue) { this.overdue = overdue; }

    public List<DueSoonItemDto> getDueSoon() { return dueSoon; }
    public void setDueSoon(List<DueSoonItemDto> dueSoon) { this.dueSoon = dueSoon; }
}

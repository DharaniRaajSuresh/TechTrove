package com.techtrove.rental.dto;

/**
 * Represents the computed payment status for a rental.
 * This is NOT stored in the database — it's calculated on-the-fly.
 */
public class RentalStatusDto {
    private java.math.BigDecimal totalExpected;
    private java.math.BigDecimal totalPaid;
    private java.math.BigDecimal outstanding;
    private String nextDueDate;
    private long daysUntilDue;
    private boolean isOverdue;
    private long daysOverdue;
    private boolean isDueSoon;

    public RentalStatusDto() {}

    public RentalStatusDto(java.math.BigDecimal totalExpected, java.math.BigDecimal totalPaid, java.math.BigDecimal outstanding,
                           String nextDueDate, long daysUntilDue, boolean isOverdue,
                           long daysOverdue, boolean isDueSoon) {
        this.totalExpected = totalExpected;
        this.totalPaid = totalPaid;
        this.outstanding = outstanding;
        this.nextDueDate = nextDueDate;
        this.daysUntilDue = daysUntilDue;
        this.isOverdue = isOverdue;
        this.daysOverdue = daysOverdue;
        this.isDueSoon = isDueSoon;
    }

    public java.math.BigDecimal getTotalExpected() { return totalExpected; }
    public java.math.BigDecimal getTotalPaid() { return totalPaid; }
    public java.math.BigDecimal getOutstanding() { return outstanding; }
    public String getNextDueDate() { return nextDueDate; }
    public long getDaysUntilDue() { return daysUntilDue; }
    public boolean isOverdue() { return isOverdue; }
    public long getDaysOverdue() { return daysOverdue; }
    public boolean isDueSoon() { return isDueSoon; }
}

package com.techtrove.rental.service;

import com.techtrove.rental.dto.RentalStatusDto;
import com.techtrove.rental.model.*;
import com.techtrove.rental.model.enums.BillingCycle;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RentalServiceTest {

    private RentalService service;
    private MockedStatic<LocalDate> mockLocalDate;
    private LocalDate fixedNow;

    @BeforeEach
    void setUp() {
        service = new RentalService();
        fixedNow = LocalDate.of(2026, 7, 19);
        mockLocalDate = Mockito.mockStatic(LocalDate.class, Mockito.CALLS_REAL_METHODS);
        mockLocalDate.when(LocalDate::now).thenReturn(fixedNow);
    }

    @AfterEach
    void tearDown() {
        mockLocalDate.close();
    }

    private Rental aRental(LocalDate startDate, BillingCycle cycle, BigDecimal rentAmount, Integer customDays) {
        Rental r = new Rental();
        r.setId("test-1");
        r.setStartDate(startDate);
        r.setBillingCycle(cycle);
        r.setRentAmount(rentAmount);
        r.setCustomDays(customDays);
        return r;
    }

    private Rental aRental(LocalDate startDate, BillingCycle cycle, BigDecimal rentAmount) {
        return aRental(startDate, cycle, rentAmount, null);
    }

    private Payment aPayment(int amount) {
        Payment p = new Payment();
        p.setAmount(BigDecimal.valueOf(amount));
        p.setDate(fixedNow);
        return p;
    }

    @Test
    void cycleDays_weekly_returns7() {
        Rental r = aRental(fixedNow, BillingCycle.WEEKLY, BigDecimal.valueOf(1000));
        assertEquals(7, service.cycleDays(r));
    }

    @Test
    void cycleDays_monthly_returns30() {
        Rental r = aRental(fixedNow, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        assertEquals(30, service.cycleDays(r));
    }

    @Test
    void cycleDays_custom15_returns15() {
        Rental r = aRental(fixedNow, BillingCycle.CUSTOM, BigDecimal.valueOf(1000), 15);
        assertEquals(15, service.cycleDays(r));
    }

    @Test
    void cycleDays_custom0_returns30() {
        Rental r = aRental(fixedNow, BillingCycle.CUSTOM, BigDecimal.valueOf(1000), 0);
        assertEquals(30, service.cycleDays(r));
    }

    @Test
    void cycleDays_customNull_returns30() {
        Rental r = aRental(fixedNow, BillingCycle.CUSTOM, BigDecimal.valueOf(1000), null);
        assertEquals(30, service.cycleDays(r));
    }

    @Test
    void cycleDays_custom1_returns1() {
        Rental r = aRental(fixedNow, BillingCycle.CUSTOM, BigDecimal.valueOf(1000), 1);
        assertEquals(1, service.cycleDays(r));
    }

    @Test
    void status_justStarted_allZero_notOverdue_notDueSoon() {
        Rental r = aRental(fixedNow, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.ZERO, st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertEquals(fixedNow.plusDays(30).toString(), st.getNextDueDate());
        assertEquals(30, st.getDaysUntilDue());
        assertFalse(st.isOverdue());
        assertEquals(0, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_40daysNoPayments_1cycleOverdue() {
        Rental r = aRental(fixedNow.minusDays(40), BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.valueOf(1000), st.getOutstanding());
        assertEquals(fixedNow.minusDays(40).plusDays(60).toString(), st.getNextDueDate());
        assertEquals(20, st.getDaysUntilDue());
        assertTrue(st.isOverdue());
        assertEquals(10, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_40daysFullyPaid_notOverdue() {
        LocalDate start = fixedNow.minusDays(40);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, List.of(aPayment(1000)));

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.valueOf(1000), st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertFalse(st.isOverdue());
        assertEquals(0, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_40daysPartialPayment_overdue() {
        LocalDate start = fixedNow.minusDays(40);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, List.of(aPayment(400)));

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.valueOf(400), st.getTotalPaid());
        assertEquals(BigDecimal.valueOf(600), st.getOutstanding());
        assertTrue(st.isOverdue());
        assertEquals(10, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_25daysNoPayments_dueSoonNotOverdue() {
        LocalDate start = fixedNow.minusDays(25);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.ZERO, st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertEquals(start.plusDays(30).toString(), st.getNextDueDate());
        assertEquals(5, st.getDaysUntilDue());
        assertFalse(st.isOverdue());
        assertTrue(st.isDueSoon());
    }

    @Test
    void status_55daysFullyPaidFirstCycle_dueSoonNotOverdue() {
        LocalDate start = fixedNow.minusDays(55);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, List.of(aPayment(1000)));

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.valueOf(1000), st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertEquals(start.plusDays(60).toString(), st.getNextDueDate());
        assertEquals(5, st.getDaysUntilDue());
        assertFalse(st.isOverdue());
        assertTrue(st.isDueSoon());
    }

    @Test
    void status_65daysNoPayments_2cyclesOverdue() {
        LocalDate start = fixedNow.minusDays(65);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.valueOf(2000), st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.valueOf(2000), st.getOutstanding());
        assertEquals(start.plusDays(90).toString(), st.getNextDueDate());
        assertTrue(st.isOverdue());
        assertEquals(5, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_weekly5daysNoPayments_dueSoon() {
        LocalDate start = fixedNow.minusDays(5);
        Rental r = aRental(start, BillingCycle.WEEKLY, BigDecimal.valueOf(500));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.ZERO, st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertEquals(start.plusDays(7).toString(), st.getNextDueDate());
        assertEquals(2, st.getDaysUntilDue());
        assertFalse(st.isOverdue());
        assertTrue(st.isDueSoon());
    }

    @Test
    void status_overpaid_notOverdue_notDueSoon() {
        LocalDate start = fixedNow.minusDays(40);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, List.of(aPayment(2500)));

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.valueOf(2500), st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertFalse(st.isOverdue());
        assertEquals(0, st.getDaysOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_zeroRent_neverOverdue() {
        LocalDate start = fixedNow.minusDays(40);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.ZERO);
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.ZERO, st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertEquals(BigDecimal.ZERO, st.getOutstanding());
        assertFalse(st.isOverdue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_95daysPartialPayment_3cyclesOverdue() {
        LocalDate start = fixedNow.minusDays(95);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, List.of(aPayment(1000), aPayment(1000), aPayment(500)));

        assertEquals(BigDecimal.valueOf(3000), st.getTotalExpected());
        assertEquals(BigDecimal.valueOf(2500), st.getTotalPaid());
        assertEquals(BigDecimal.valueOf(500), st.getOutstanding());
        assertTrue(st.isOverdue());
        assertEquals(5, st.getDaysOverdue());
        assertEquals(start.plusDays(120).toString(), st.getNextDueDate());
        assertEquals(25, st.getDaysUntilDue());
        assertFalse(st.isDueSoon());
    }

    @Test
    void status_exactly30days_oneCycle_completed() {
        LocalDate start = fixedNow.minusDays(30);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.valueOf(1000), st.getTotalExpected());
        assertEquals(BigDecimal.ZERO, st.getTotalPaid());
        assertTrue(st.isOverdue());
        assertEquals(0, st.getDaysOverdue());
    }

    @Test
    void status_exactlyOnDueDate_daysOverdueZero() {
        LocalDate start = fixedNow.minusDays(60);
        Rental r = aRental(start, BillingCycle.MONTHLY, BigDecimal.valueOf(1000));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.valueOf(2000), st.getTotalExpected());
        assertTrue(st.isOverdue());
        assertEquals(0, st.getDaysOverdue());
    }

    @Test
    void status_exactly1dayBeforeDue_weekly() {
        LocalDate start = fixedNow.minusDays(6);
        Rental r = aRental(start, BillingCycle.WEEKLY, BigDecimal.valueOf(500));
        RentalStatusDto st = service.computeStatus(r, Collections.emptyList());

        assertEquals(BigDecimal.ZERO, st.getTotalExpected());
        assertEquals(1, st.getDaysUntilDue());
        assertFalse(st.isOverdue());
        assertTrue(st.isDueSoon());
    }
}

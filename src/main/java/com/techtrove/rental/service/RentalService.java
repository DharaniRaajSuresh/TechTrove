package com.techtrove.rental.service;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.mapper.CustomerMapper;
import com.techtrove.rental.mapper.RentalMapper;
import com.techtrove.rental.model.*;
import com.techtrove.rental.model.enums.RentalStatus;
import com.techtrove.rental.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ALL rental business logic lives here.
 *
 * The original JavaScript computed everything client-side in rentalStatus().
 * We moved it to the server so all clients (web, mobile, API) get the same results.
 */
@Service
public class RentalService {

    @Autowired private RentalRepository rentalRepo;
    @Autowired private PaymentRepository paymentRepo;
    @Autowired private CustomerRepository customerRepo;
    @Autowired private ItemRepository itemRepo;

    @Autowired
    private CustomerMapper customerMapper;
    @Autowired
    private RentalMapper rentalMapper;

    /* ────────────────────────────────────────────
     * cycleDays()
     * Matches the JS function exactly:
     *   weekly  → 7
     *   monthly → 30
     *   custom  → Math.max(1, parseInt(customDays) || 30)
     * ──────────────────────────────────────────── */
    public int cycleDays(Rental rental) {
        return switch (rental.getBillingCycle()) {
            case WEEKLY -> 7;
            case MONTHLY -> 30;
            case CUSTOM -> Math.max(1, rental.getCustomDays() != null && rental.getCustomDays() != 0 ? rental.getCustomDays() : 30);
        };
    }

    /* ────────────────────────────────────────────
     * computeStatus()
     * Matches the JS rentalStatus() function exactly.
     *
     * Key formulas:
     *   completedCycles = floor(daysSince / cycleDays)
     *   totalExpected   = completedCycles × rentAmount
     *   totalPaid       = sum of all payment amounts
     *   outstanding     = max(0, totalExpected - totalPaid)
     *   isOverdue       = totalExpected > totalPaid AND completedCycles > 0
     *   isDueSoon       = NOT nextCyclePaid AND 0 ≤ daysUntilDue ≤ 7
     * ──────────────────────────────────────────── */
    public RentalStatusDto computeStatus(Rental rental, List<Payment> payments) {
        int cd = cycleDays(rental);
        LocalDate start = rental.getStartDate();
        LocalDate end = rental.getEndDate();
        LocalDate now = end != null ? end : LocalDate.now();

        long daysSince = ChronoUnit.DAYS.between(start, now);
        long completedCycles = Math.max(0, daysSince / cd);

        BigDecimal rentAmount = rental.getRentAmount();
        long billedCycles = completedCycles + 1;
        BigDecimal totalExpected = BigDecimal.valueOf(billedCycles).multiply(rentAmount);
        BigDecimal totalPaid = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = totalExpected.subtract(totalPaid).max(BigDecimal.ZERO);

        LocalDate nextDueDate = start.plusDays((completedCycles + 1) * cd);
        long daysUntilDue = ChronoUnit.DAYS.between(now, nextDueDate);

        boolean isOverdue = totalExpected.compareTo(totalPaid) > 0 && completedCycles > 0;
        LocalDate currentCycleEnd = start.plusDays(completedCycles * cd);
        long daysOverdue = isOverdue ? ChronoUnit.DAYS.between(currentCycleEnd, now) : 0;

        boolean nextCyclePaid = totalPaid.compareTo(BigDecimal.valueOf(billedCycles + 1).multiply(rentAmount)) >= 0;
        boolean isDueSoon = !nextCyclePaid && daysUntilDue >= 0 && daysUntilDue <= 7;

        return new RentalStatusDto(
            totalExpected,
            totalPaid,
            outstanding,
            nextDueDate.toString(),
            daysUntilDue,
            isOverdue,
            daysOverdue,
            isDueSoon
        );
    }

    /* ────────────────────────────────────────────
     * getOverdueList()
     * Active rentals where totalExpected > totalPaid AND at least 1 cycle completed.
     * Sorted by daysOverdue descending (worst first).
     * ──────────────────────────────────────────── */
    public List<OverdueItemDto> getOverdueList() {
        return getOverdueList(null);
    }

    public List<OverdueItemDto> getOverdueList(Map<String, List<Payment>> paymentsByRental) {
        List<OverdueItemDto> result = new ArrayList<>();
        List<Rental> activeRentals = rentalRepo.findByStatus(RentalStatus.ACTIVE);

        if (paymentsByRental == null) {
            List<String> rentalIds = activeRentals.stream().map(Rental::getId).toList();
            paymentsByRental = paymentRepo.findByRentalIdIn(rentalIds)
                .stream().collect(Collectors.groupingBy(p -> p.getRental().getId()));
        }

        for (Rental r : activeRentals) {
            List<Payment> payments = paymentsByRental.getOrDefault(r.getId(), List.of());
            RentalStatusDto st = computeStatus(r, payments);
            if (st.isOverdue()) {
                Customer c = customerRepo.findById(r.getCustomer().getId()).orElse(null);
                if (c != null) {
                    result.add(new OverdueItemDto(customerMapper.toDto(c), rentalMapper.toDto(r), st));
                }
            }
        }
        result.sort((a, b) -> Long.compare(b.getStatus().getDaysOverdue(), a.getStatus().getDaysOverdue()));
        return result;
    }

    /* ────────────────────────────────────────────
     * getDueSoonList()
     * Active rentals where isDueSoon AND NOT isOverdue.
     * Sorted by daysUntilDue ascending (soonest first).
     * ──────────────────────────────────────────── */
    public List<DueSoonItemDto> getDueSoonList() {
        return getDueSoonList(null);
    }

    public List<DueSoonItemDto> getDueSoonList(Map<String, List<Payment>> paymentsByRental) {
        List<DueSoonItemDto> result = new ArrayList<>();
        List<Rental> activeRentals = rentalRepo.findByStatus(RentalStatus.ACTIVE);

        if (paymentsByRental == null) {
            List<String> rentalIds = activeRentals.stream().map(Rental::getId).toList();
            paymentsByRental = paymentRepo.findByRentalIdIn(rentalIds)
                .stream().collect(Collectors.groupingBy(p -> p.getRental().getId()));
        }

        for (Rental r : activeRentals) {
            List<Payment> payments = paymentsByRental.getOrDefault(r.getId(), List.of());
            RentalStatusDto st = computeStatus(r, payments);
            if (st.isDueSoon() && !st.isOverdue()) {
                Customer c = customerRepo.findById(r.getCustomer().getId()).orElse(null);
                if (c != null) {
                    result.add(new DueSoonItemDto(customerMapper.toDto(c), rentalMapper.toDto(r), st));
                }
            }
        }
        result.sort((a, b) -> Long.compare(a.getStatus().getDaysUntilDue(), b.getStatus().getDaysUntilDue()));
        return result;
    }

    /* ────────────────────────────────────────────
     * getDashboard()
     * Aggregates all metrics the dashboard needs in one call.
     * ──────────────────────────────────────────── */
    public DashboardDto getDashboard() {
        DashboardDto dto = new DashboardDto();
        dto.setTotalCustomers(customerRepo.count());
        dto.setTotalItems(itemRepo.count());

        List<Rental> activeRentals = rentalRepo.findByStatus(RentalStatus.ACTIVE);
        dto.setActiveRentals(activeRentals.size());

        // Batch-load payments for active rentals
        List<String> rentalIds = activeRentals.stream().map(Rental::getId).toList();
        Map<String, List<Payment>> paymentsByRental = paymentRepo.findByRentalIdIn(rentalIds)
            .stream().collect(Collectors.groupingBy(p -> p.getRental().getId()));

        // Monthly collected: sum of payments where date >= first of current month
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        BigDecimal monthlyCollected = paymentRepo.findAll().stream()
                .filter(p -> !p.getDate().isBefore(monthStart))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setMonthlyCollected(monthlyCollected);

        // Outstanding total: sum of outstanding across all active rentals
        BigDecimal outstandingTotal = BigDecimal.ZERO;
        for (Rental r : activeRentals) {
            List<Payment> payments = paymentsByRental.getOrDefault(r.getId(), List.of());
            outstandingTotal = outstandingTotal.add(computeStatus(r, payments).getOutstanding());
        }
        dto.setOutstandingTotal(outstandingTotal);

        dto.setOverdue(getOverdueList(paymentsByRental));
        dto.setDueSoon(getDueSoonList(paymentsByRental));

        return dto;
    }

}

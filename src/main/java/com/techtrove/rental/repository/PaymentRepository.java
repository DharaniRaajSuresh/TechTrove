package com.techtrove.rental.repository;

import com.techtrove.rental.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByRentalId(String rentalId);
    List<Payment> findByRentalIdIn(List<String> rentalIds);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.date >= :monthStart AND p.date < :nextMonthStart")
    BigDecimal sumPaymentsSince(@Param("monthStart") LocalDate monthStart, @Param("nextMonthStart") LocalDate nextMonthStart);
}

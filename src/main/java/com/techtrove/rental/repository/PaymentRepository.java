package com.techtrove.rental.repository;

import com.techtrove.rental.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByRentalId(String rentalId);
    List<Payment> findByRentalIdIn(List<String> rentalIds);
}

package com.techtrove.rental.repository;

import com.techtrove.rental.model.Rental;
import com.techtrove.rental.model.enums.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, String> {
    List<Rental> findByCustomerId(String customerId);
    List<Rental> findByStatus(RentalStatus status);
    List<Rental> findByItemIdAndStatus(String itemId, RentalStatus status);
    List<Rental> findByCustomerIdAndStatus(String customerId, RentalStatus status);
}

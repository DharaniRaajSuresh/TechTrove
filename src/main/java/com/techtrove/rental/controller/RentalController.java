package com.techtrove.rental.controller;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.model.*;
import com.techtrove.rental.model.enums.*;
import com.techtrove.rental.repository.*;
import com.techtrove.rental.service.RentalService;
import com.techtrove.rental.service.AuditService;
import com.techtrove.rental.mapper.RentalMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    @Autowired
    private RentalRepository rentalRepo;

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private CustomerRepository customerRepo;

    @Autowired
    private ItemRepository itemRepo;

    @Autowired
    private RentalService rentalService;

    @Autowired
    private RentalMapper rentalMapper;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<RentalDto> getAllRentals() {
        return rentalRepo.findAll().stream()
                .map(rentalMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public RentalDto getRental(@PathVariable String id) {
        Rental rental = rentalRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental not found"));
        return rentalMapper.toDto(rental);
    }

    @GetMapping("/{id}/status")
    public RentalStatusDto getRentalStatus(@PathVariable String id) {
        Rental rental = rentalRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental not found"));
        List<Payment> payments = paymentRepo.findByRentalId(id);
        return rentalService.computeStatus(rental, payments);
    }

    @PostMapping
    public ResponseEntity<RentalDto> createRental(@Valid @RequestBody RentalDto dto) {
        Customer customer = customerRepo.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer not found"));
        Item item = itemRepo.findById(dto.getItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item not found"));

        Rental entity = rentalMapper.toEntity(dto);
        entity.setCustomer(customer);
        entity.setItem(item);

        Rental saved = rentalRepo.save(entity);
        auditService.log("CREATE", "rental", saved.getId(), "Created rental for " + dto.getCustomerId());
        return ResponseEntity.status(HttpStatus.CREATED).body(rentalMapper.toDto(saved));
    }

    @PutMapping("/{id}")
    public RentalDto updateRental(@PathVariable String id, @Valid @RequestBody RentalDto dto) {
        Rental existing = rentalRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental not found"));

        Customer customer = customerRepo.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer not found"));
        Item item = itemRepo.findById(dto.getItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item not found"));

        Rental updated = rentalMapper.toEntity(dto);
        updated.setId(id);
        updated.setCustomer(customer);
        updated.setItem(item);

        Rental saved = rentalRepo.save(updated);
        auditService.log("UPDATE", "rental", id, "Updated rental for " + dto.getCustomerId());
        return rentalMapper.toDto(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRental(@PathVariable String id) {
        Rental existing = rentalRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental not found"));

        List<Payment> payments = paymentRepo.findByRentalId(id);
        if (!payments.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Cannot delete rental with payments"));
        }

        rentalRepo.delete(existing);
        auditService.log("DELETE", "rental", id, "Deleted rental");
        return ResponseEntity.noContent().build();
    }


}

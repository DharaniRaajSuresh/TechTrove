package com.techtrove.rental.controller;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.model.*;
import com.techtrove.rental.mapper.PaymentMapper;
import com.techtrove.rental.repository.*;
import com.techtrove.rental.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private RentalRepository rentalRepo;

    @Autowired
    private PaymentMapper paymentMapper;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<PaymentDto> getAllPayments(@RequestParam(required = false) String rentalId) {
        if (rentalId != null) {
            return paymentRepo.findByRentalId(rentalId).stream()
                    .map(paymentMapper::toDto)
                    .toList();
        }
        return paymentRepo.findAll().stream()
                .map(paymentMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public PaymentDto getPayment(@PathVariable String id) {
        Payment payment = paymentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return paymentMapper.toDto(payment);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PaymentDto> createPayment(@Valid @RequestBody PaymentDto dto) {
        Rental rental = rentalRepo.findById(dto.getRentalId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rental not found"));

        Payment entity = paymentMapper.toEntity(dto);
        entity.setRental(rental);

        Payment saved = paymentRepo.save(entity);
        auditService.log("CREATE", "payment", saved.getId(), "Created payment of " + dto.getAmount() + " for rental " + dto.getRentalId());
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMapper.toDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public PaymentDto updatePayment(@PathVariable String id, @Valid @RequestBody PaymentDto dto) {
        Payment existing = paymentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        Rental rental = rentalRepo.findById(dto.getRentalId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rental not found"));

        Payment updated = paymentMapper.toEntity(dto);
        updated.setId(id);
        updated.setRental(rental);

        Payment saved = paymentRepo.save(updated);
        auditService.log("UPDATE", "payment", id, "Updated payment of " + dto.getAmount() + " for rental " + dto.getRentalId());
        return paymentMapper.toDto(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePayment(@PathVariable String id) {
        Payment existing = paymentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        paymentRepo.delete(existing);
        auditService.log("DELETE", "payment", id, "Deleted payment");
        return ResponseEntity.noContent().build();
    }


}

package com.techtrove.rental.controller;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.model.*;
import com.techtrove.rental.model.enums.RentalStatus;
import com.techtrove.rental.mapper.CustomerMapper;
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
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RentalRepository rentalRepository;

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(customerMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public CustomerDto getCustomer(@PathVariable String id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        return customerMapper.toDto(customer);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CustomerDto> createCustomer(@Valid @RequestBody CustomerDto dto) {
        Customer entity = customerMapper.toEntity(dto);
        Customer saved = customerRepository.save(entity);
        auditService.log("CREATE", "customer", saved.getId(), "Created customer " + dto.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(customerMapper.toDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public CustomerDto updateCustomer(@PathVariable String id, @Valid @RequestBody CustomerDto dto) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        Customer updated = customerMapper.toEntity(dto);
        updated.setId(id);
        Customer saved = customerRepository.save(updated);
        auditService.log("UPDATE", "customer", id, "Updated customer " + dto.getName());
        return customerMapper.toDto(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCustomer(@PathVariable String id) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        List<Rental> activeRentals = rentalRepository.findByCustomerIdAndStatus(id, RentalStatus.ACTIVE);
        if (!activeRentals.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Customer has active rentals"));
        }
        customerRepository.delete(existing);
        auditService.log("DELETE", "customer", id, "Deleted customer");
        return ResponseEntity.noContent().build();
    }


}

package com.techtrove.rental.service;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.mapper.CustomerMapper;
import com.techtrove.rental.mapper.ItemMapper;
import com.techtrove.rental.mapper.PaymentMapper;
import com.techtrove.rental.mapper.RentalMapper;
import com.techtrove.rental.model.*;
import com.techtrove.rental.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataService {

    @Autowired private CustomerRepository customerRepo;
    @Autowired private ItemRepository itemRepo;
    @Autowired private RentalRepository rentalRepo;
    @Autowired private PaymentRepository paymentRepo;
    @Autowired private AuditService auditService;

    @Autowired
    private CustomerMapper customerMapper;
    @Autowired
    private ItemMapper itemMapper;
    @Autowired
    private RentalMapper rentalMapper;
    @Autowired
    private PaymentMapper paymentMapper;

    /* ──── LOAD: Convert Entities → DTOs ──── */

    public DataBlob loadAll() {
        DataBlob blob = new DataBlob();
        blob.setCustomers(customerRepo.findAll().stream().map(customerMapper::toDto).collect(Collectors.toList()));
        blob.setItems(itemRepo.findAll().stream().map(itemMapper::toDto).collect(Collectors.toList()));
        blob.setRentals(rentalRepo.findAll().stream().map(rentalMapper::toDto).collect(Collectors.toList()));
        blob.setPayments(paymentRepo.findAll().stream().map(paymentMapper::toDto).collect(Collectors.toList()));
        return blob;
    }

    /* ──── SAVE: Replace all data (DTO → Entity) ──── */

    @Transactional
    public void saveAll(DataBlob blob) {
        // Delete in reverse dependency order (children first)
        paymentRepo.deleteAll();
        rentalRepo.deleteAll();
        itemRepo.deleteAll();
        customerRepo.deleteAll();

        // Insert customers
        Map<String, Customer> customerMap = new HashMap<>();
        if (blob.getCustomers() != null) {
            for (CustomerDto d : blob.getCustomers()) {
                Customer c = customerMapper.toEntity(d);
                customerRepo.save(c);
                customerMap.put(c.getId(), c);
            }
        }

        // Insert items
        Map<String, Item> itemMap = new HashMap<>();
        if (blob.getItems() != null) {
            for (ItemDto d : blob.getItems()) {
                Item i = itemMapper.toEntity(d);
                itemRepo.save(i);
                itemMap.put(i.getId(), i);
            }
        }

        // Insert rentals
        if (blob.getRentals() != null) {
            for (RentalDto d : blob.getRentals()) {
                Rental r = rentalMapper.toEntity(d);
                r.setCustomer(customerMap.get(d.getCustomerId()));
                r.setItem(itemMap.get(d.getItemId()));
                rentalRepo.save(r);
            }
        }

        // Insert payments
        if (blob.getPayments() != null) {
            Map<String, Rental> rentalMap = new HashMap<>();
            for (Rental r : rentalRepo.findAll()) rentalMap.put(r.getId(), r);

            for (PaymentDto d : blob.getPayments()) {
                Payment p = paymentMapper.toEntity(d);
                p.setRental(rentalMap.get(d.getRentalId()));
                paymentRepo.save(p);
            }
        }

        auditService.log("BULK_SAVE", "DataBlob",
            "all", "Saved " + (blob.getCustomers() != null ? blob.getCustomers().size() : 0) +
            " customers, " + (blob.getItems() != null ? blob.getItems().size() : 0) +
            " items, " + (blob.getRentals() != null ? blob.getRentals().size() : 0) +
            " rentals, " + (blob.getPayments() != null ? blob.getPayments().size() : 0) + " payments");
    }
}

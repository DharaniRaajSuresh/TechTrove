package com.techtrove.rental.service;

import com.techtrove.rental.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DataServiceTest {

    @Autowired
    private DataService dataService;

    @BeforeEach
    void setUp() {
        dataService.saveAll(new DataBlob());
    }

    @Test
    void saveAndLoad_emptyBlob() {
        DataBlob blob = new DataBlob();
        blob.setCustomers(List.of());
        blob.setItems(List.of());
        blob.setRentals(List.of());
        blob.setPayments(List.of());

        dataService.saveAll(blob);
        DataBlob loaded = dataService.loadAll();

        assertTrue(loaded.getCustomers().isEmpty());
        assertTrue(loaded.getItems().isEmpty());
        assertTrue(loaded.getRentals().isEmpty());
        assertTrue(loaded.getPayments().isEmpty());
    }

    @Test
    void saveAndLoad_fullRoundTrip() {
        CustomerDto customer = new CustomerDto();
        customer.setId("cust-1");
        customer.setName("John Doe");
        customer.setPhone("555-0100");
        customer.setAddress("123 Main St");
        customer.setCreatedAt("2026-07-01");

        ItemDto item = new ItemDto();
        item.setId("item-1");
        item.setType("Laptop");
        item.setBrand("Dell");
        item.setSerial("SN-001");
        item.setStatus("rented");
        item.setCreatedAt("2026-07-01");

        RentalDto rental = new RentalDto();
        rental.setId("rental-1");
        rental.setCustomerId("cust-1");
        rental.setItemId("item-1");
        rental.setRentAmount(BigDecimal.valueOf(1500));
        rental.setBillingCycle("monthly");
        rental.setCustomDays(null);
        rental.setStartDate("2026-07-01");
        rental.setEndDate(null);
        rental.setStatus("active");
        rental.setCreatedAt("2026-07-01");

        PaymentDto payment = new PaymentDto();
        payment.setId("pay-1");
        payment.setRentalId("rental-1");
        payment.setAmount(BigDecimal.valueOf(1500));
        payment.setDate("2026-07-01");
        payment.setMethod("Cash");
        payment.setRemarks("First payment");
        payment.setCreatedAt("2026-07-01");

        DataBlob blob = new DataBlob();
        blob.setCustomers(List.of(customer));
        blob.setItems(List.of(item));
        blob.setRentals(List.of(rental));
        blob.setPayments(List.of(payment));

        dataService.saveAll(blob);
        DataBlob loaded = dataService.loadAll();

        assertEquals(1, loaded.getCustomers().size());
        CustomerDto c = loaded.getCustomers().get(0);
        assertEquals("cust-1", c.getId());
        assertEquals("John Doe", c.getName());
        assertEquals("555-0100", c.getPhone());
        assertEquals("123 Main St", c.getAddress());
        assertEquals("2026-07-01", c.getCreatedAt());

        assertEquals(1, loaded.getItems().size());
        ItemDto i = loaded.getItems().get(0);
        assertEquals("item-1", i.getId());
        assertEquals("Laptop", i.getType());
        assertEquals("Dell", i.getBrand());
        assertEquals("SN-001", i.getSerial());
        assertEquals("rented", i.getStatus());
        assertEquals("2026-07-01", i.getCreatedAt());

        assertEquals(1, loaded.getRentals().size());
        RentalDto r = loaded.getRentals().get(0);
        assertEquals("rental-1", r.getId());
        assertEquals("cust-1", r.getCustomerId());
        assertEquals("item-1", r.getItemId());
        assertEquals(0, BigDecimal.valueOf(1500).compareTo(r.getRentAmount()));
        assertEquals("monthly", r.getBillingCycle());
        assertNull(r.getCustomDays());
        assertEquals("2026-07-01", r.getStartDate());
        assertNull(r.getEndDate());
        assertEquals("active", r.getStatus());
        assertEquals("2026-07-01", r.getCreatedAt());

        assertEquals(1, loaded.getPayments().size());
        PaymentDto p = loaded.getPayments().get(0);
        assertEquals("pay-1", p.getId());
        assertEquals("rental-1", p.getRentalId());
        assertEquals(0, BigDecimal.valueOf(1500).compareTo(p.getAmount()));
        assertEquals("2026-07-01", p.getDate());
        assertEquals("Cash", p.getMethod());
        assertEquals("First payment", p.getRemarks());
        assertEquals("2026-07-01", p.getCreatedAt());
    }

    @Test
    void saveAndLoad_overwrite() {
        CustomerDto oldCust = new CustomerDto();
        oldCust.setId("cust-old");
        oldCust.setName("Old Name");
        oldCust.setPhone("111-1111");
        oldCust.setAddress("Old Address");
        oldCust.setCreatedAt("2026-07-01");

        DataBlob blob1 = new DataBlob();
        blob1.setCustomers(List.of(oldCust));
        blob1.setItems(List.of());
        blob1.setRentals(List.of());
        blob1.setPayments(List.of());
        dataService.saveAll(blob1);

        CustomerDto newCust = new CustomerDto();
        newCust.setId("cust-new");
        newCust.setName("New Name");
        newCust.setPhone("222-2222");
        newCust.setAddress("New Address");
        newCust.setCreatedAt("2026-07-15");

        DataBlob blob2 = new DataBlob();
        blob2.setCustomers(List.of(newCust));
        blob2.setItems(List.of());
        blob2.setRentals(List.of());
        blob2.setPayments(List.of());
        dataService.saveAll(blob2);

        DataBlob loaded = dataService.loadAll();
        assertEquals(1, loaded.getCustomers().size());
        assertEquals("cust-new", loaded.getCustomers().get(0).getId());
        assertEquals("New Name", loaded.getCustomers().get(0).getName());
    }
}

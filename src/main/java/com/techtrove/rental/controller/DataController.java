package com.techtrove.rental.controller;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.service.DataService;
import com.techtrove.rental.service.RentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DataController {

    @Autowired
    private DataService dataService;

    @Autowired
    private RentalService rentalService;

    /* Phase 1: Monolithic blob endpoints (backward compat) */

    @GetMapping("/data")
    public ResponseEntity<DataBlob> getData() {
        return ResponseEntity.ok(dataService.loadAll());
    }

    @PostMapping("/data")
    public ResponseEntity<?> putData(@RequestBody DataBlob blob) {
        if (blob.getCustomers() == null || blob.getItems() == null ||
            blob.getRentals() == null || blob.getPayments() == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid data format"));
        }
        dataService.saveAll(blob);
        return ResponseEntity.ok(new LoginResponse(true));
    }

    /* Phase 2: Server-computed dashboard */

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDto> getDashboard() {
        return ResponseEntity.ok(rentalService.getDashboard());
    }
}

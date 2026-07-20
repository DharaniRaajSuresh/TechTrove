package com.techtrove.rental.controller;

import com.techtrove.rental.dto.*;
import com.techtrove.rental.model.*;
import com.techtrove.rental.model.enums.*;
import com.techtrove.rental.mapper.ItemMapper;
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
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private RentalRepository rentalRepository;

    @Autowired
    private ItemMapper itemMapper;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<ItemDto> getAllItems() {
        return itemRepository.findAll().stream()
                .map(itemMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ItemDto getItem(@PathVariable String id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        return itemMapper.toDto(item);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ItemDto> createItem(@Valid @RequestBody ItemDto dto) {
        Item entity = itemMapper.toEntity(dto);
        Item saved = itemRepository.save(entity);
        auditService.log("CREATE", "item", saved.getId(), "Created " + dto.getType() + " " + dto.getBrand());
        return ResponseEntity.status(HttpStatus.CREATED).body(itemMapper.toDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ItemDto updateItem(@PathVariable String id, @Valid @RequestBody ItemDto dto) {
        Item existing = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        Item updated = itemMapper.toEntity(dto);
        updated.setId(id);
        Item saved = itemRepository.save(updated);
        auditService.log("UPDATE", "item", id, "Updated " + dto.getType() + " " + dto.getBrand());
        return itemMapper.toDto(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteItem(@PathVariable String id) {
        Item existing = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        List<Rental> activeRentals = rentalRepository.findByItemIdAndStatus(id, RentalStatus.ACTIVE);
        if (!activeRentals.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Item has active rentals"));
        }
        itemRepository.delete(existing);
        auditService.log("DELETE", "item", id, "Deleted item");
        return ResponseEntity.noContent().build();
    }


}

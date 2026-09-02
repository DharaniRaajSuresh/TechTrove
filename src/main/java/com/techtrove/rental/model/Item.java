package com.techtrove.rental.model;

import com.techtrove.rental.model.enums.ItemStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @Column(length = 36)
    private String id;

    @NotBlank
    @Column(nullable = false)
    private String type;

    @NotBlank
    @Column(nullable = false)
    private String brand;

    private String model;

    @Column(columnDefinition = "TEXT")
    private String specs;

    @Column(columnDefinition = "TEXT")
    private String repairInfo;

    @NotBlank
    @Column(nullable = false)
    private String serial;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;

    @Column(nullable = false)
    private LocalDate createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }

    public Item() {}

    public Item(String id, String type, String brand, String model, String specs, String serial, ItemStatus status, LocalDate createdAt) {
        this.id = id; this.type = type; this.brand = brand; this.model = model; this.specs = specs;
        this.serial = serial; this.status = status; this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSpecs() { return specs; }
    public void setSpecs(String specs) { this.specs = specs; }

    public String getRepairInfo() { return repairInfo; }
    public void setRepairInfo(String repairInfo) { this.repairInfo = repairInfo; }

    public String getSerial() { return serial; }
    public void setSerial(String serial) { this.serial = serial; }

    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}

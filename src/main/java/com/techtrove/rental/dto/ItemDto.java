package com.techtrove.rental.dto;

import jakarta.validation.constraints.NotBlank;

public class ItemDto {
    private String id;
    @NotBlank
    private String type;
    @NotBlank
    private String brand;
    private String model;
    private String specs;
    private String repairInfo;
    @NotBlank
    private String serial;
    @NotBlank
    private String status;
    private String createdAt;

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}


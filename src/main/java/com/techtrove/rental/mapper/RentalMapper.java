package com.techtrove.rental.mapper;

import com.techtrove.rental.dto.RentalDto;
import com.techtrove.rental.model.Rental;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RentalMapper {

    @Mapping(target = "customerId", expression = "java(rental.getCustomer().getId())")
    @Mapping(target = "itemId", expression = "java(rental.getItem() != null ? rental.getItem().getId() : null)")
    @Mapping(target = "rentAmount", source = "rentAmount")
    @Mapping(target = "billingCycle", expression = "java(rental.getBillingCycle().name().toLowerCase())")
    @Mapping(target = "customDays", source = "customDays")
    @Mapping(target = "startDate", expression = "java(rental.getStartDate().toString())")
    @Mapping(target = "endDate", expression = "java(rental.getEndDate() != null ? rental.getEndDate().toString() : null)")
    @Mapping(target = "status", expression = "java(rental.getStatus().name().toLowerCase())")
    @Mapping(target = "createdAt", expression = "java(rental.getCreatedAt().toString())")
    RentalDto toDto(Rental rental);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "item", ignore = true)
    @Mapping(target = "rentAmount", expression = "java(dto.getRentAmount())")
    @Mapping(target = "billingCycle", expression = "java(com.techtrove.rental.model.enums.BillingCycle.valueOf(dto.getBillingCycle().toUpperCase()))")
    @Mapping(target = "startDate", expression = "java(java.time.LocalDate.parse(dto.getStartDate()))")
    @Mapping(target = "endDate", expression = "java(dto.getEndDate() != null ? java.time.LocalDate.parse(dto.getEndDate()) : null)")
    @Mapping(target = "status", expression = "java(com.techtrove.rental.model.enums.RentalStatus.valueOf(dto.getStatus().toUpperCase()))")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDate.parse(dto.getCreatedAt()))")
    Rental toEntity(RentalDto dto);
}

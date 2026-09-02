package com.techtrove.rental.mapper;

import com.techtrove.rental.dto.CustomerDto;
import com.techtrove.rental.model.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    @Mapping(target = "createdAt", expression = "java(customer.getCreatedAt() != null ? customer.getCreatedAt().toString() : null)")
    CustomerDto toDto(Customer customer);

    @Mapping(target = "createdAt", expression = "java(dto.getCreatedAt() != null && !dto.getCreatedAt().isBlank() ? java.time.LocalDate.parse(dto.getCreatedAt()) : null)")
    Customer toEntity(CustomerDto dto);
}

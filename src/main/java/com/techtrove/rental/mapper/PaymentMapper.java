package com.techtrove.rental.mapper;

import com.techtrove.rental.dto.PaymentDto;
import com.techtrove.rental.model.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "rentalId", expression = "java(payment.getRental().getId())")
    @Mapping(target = "amount", source = "amount")
    @Mapping(target = "date", expression = "java(payment.getDate().toString())")
    @Mapping(target = "createdAt", expression = "java(payment.getCreatedAt().toString())")
    PaymentDto toDto(Payment payment);

    @Mapping(target = "rental", ignore = true)
    @Mapping(target = "amount", expression = "java(dto.getAmount())")
    @Mapping(target = "date", expression = "java(java.time.LocalDate.parse(dto.getDate()))")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDate.parse(dto.getCreatedAt()))")
    Payment toEntity(PaymentDto dto);
}

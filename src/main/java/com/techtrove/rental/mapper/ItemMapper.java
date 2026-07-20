package com.techtrove.rental.mapper;

import com.techtrove.rental.dto.ItemDto;
import com.techtrove.rental.model.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ItemMapper {

    @Mapping(target = "status", expression = "java(item.getStatus().name().toLowerCase())")
    @Mapping(target = "createdAt", expression = "java(item.getCreatedAt().toString())")
    ItemDto toDto(Item item);

    @Mapping(target = "status", expression = "java(com.techtrove.rental.model.enums.ItemStatus.valueOf(dto.getStatus().toUpperCase()))")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDate.parse(dto.getCreatedAt()))")
    Item toEntity(ItemDto dto);
}

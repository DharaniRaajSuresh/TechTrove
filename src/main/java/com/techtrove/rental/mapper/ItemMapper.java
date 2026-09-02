package com.techtrove.rental.mapper;

import com.techtrove.rental.dto.ItemDto;
import com.techtrove.rental.model.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ItemMapper {

    @Mapping(target = "model", source = "model")
    @Mapping(target = "specs", source = "specs")
    @Mapping(target = "repairInfo", source = "repairInfo")
    @Mapping(target = "status", expression = "java(item.getStatus().name().toLowerCase())")
    @Mapping(target = "createdAt", expression = "java(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)")
    ItemDto toDto(Item item);

    @Mapping(target = "model", source = "model")
    @Mapping(target = "specs", source = "specs")
    @Mapping(target = "repairInfo", source = "repairInfo")
    @Mapping(target = "status", expression = "java(com.techtrove.rental.model.enums.ItemStatus.valueOf(dto.getStatus().toUpperCase()))")
    @Mapping(target = "createdAt", expression = "java(dto.getCreatedAt() != null && !dto.getCreatedAt().isBlank() ? java.time.LocalDate.parse(dto.getCreatedAt()) : null)")
    Item toEntity(ItemDto dto);
}

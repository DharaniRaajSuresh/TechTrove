package com.techtrove.rental.repository;

import com.techtrove.rental.model.Item;
import com.techtrove.rental.model.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, String> {
    List<Item> findByStatus(ItemStatus status);
}

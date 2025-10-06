package com.game.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Brand;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    
}

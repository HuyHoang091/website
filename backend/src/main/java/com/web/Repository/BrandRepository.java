package com.web.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Brand;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    
}

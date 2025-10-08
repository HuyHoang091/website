package com.web.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    
}

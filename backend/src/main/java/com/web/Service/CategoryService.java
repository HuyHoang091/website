package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Category;
import com.web.Repository.CategoryRepository;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoriRepository;

    @Cacheable(value = "categories")
    public List<Category> getAllCategories() {
        return categoriRepository.findAll();
    }

    @CacheEvict(value = "categories", allEntries = true)
    public Category createCategory(Category category) {
        return categoriRepository.save(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public boolean deleteCategory(Long id) {
        if (!categoriRepository.existsById(id)) {
            return false;
        }
        categoriRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category updateCategory(Long id, Category newCategory) {
        Category oldCategory = categoriRepository.findById(id).orElse(null);
        if (oldCategory == null) return null;
        newCategory.setId(oldCategory.getId());
        return categoriRepository.save(newCategory);
    }

    public Category getCategoryById(Long id) {
        return categoriRepository.findById(id).orElse(null);
    }
}

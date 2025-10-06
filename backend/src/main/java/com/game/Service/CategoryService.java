package com.game.Service;

import com.game.Model.Category;
import com.game.Repository.CategoryRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoriRepository;

    @Cacheable(value = "categories")
    public List<Category> getAllCategories() {
        return categoriRepository.findAll();
    }

    @CacheEvict(value = "categories", allEntries = true)
    public Category createCategori(Category categori) {
        return categoriRepository.save(categori);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public boolean deleteCategori(Long id) {
        if (!categoriRepository.existsById(id)) {
            return false;
        }
        categoriRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category updateCategori(Long id, Category newCategori) {
        Category oldCategori = categoriRepository.findById(id).orElse(null);
        if (oldCategori == null) return null;
        newCategori.setId(oldCategori.getId());
        return categoriRepository.save(newCategori);
    }
}

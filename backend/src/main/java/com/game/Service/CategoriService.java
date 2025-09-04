package com.game.Service;

import com.game.Model.Categori;
import com.game.Repository.CategoriRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class CategoriService {
    @Autowired
    private CategoriRepository categoriRepository;

    @Cacheable(value = "categories")
    public List<Categori> getAllCategories() {
        return categoriRepository.findAll();
    }

    @CacheEvict(value = "categories", allEntries = true)
    public Categori createCategori(Categori categori) {
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
    public Categori updateCategori(Long id, Categori newCategori) {
        Categori oldCategori = categoriRepository.findById(id).orElse(null);
        if (oldCategori == null) return null;
        newCategori.setId(oldCategori.getId());
        return categoriRepository.save(newCategori);
    }
}

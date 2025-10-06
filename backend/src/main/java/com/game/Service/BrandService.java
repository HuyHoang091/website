package com.game.Service;

import com.game.Model.Brand;
import com.game.Repository.BrandRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class BrandService {
    @Autowired
    private BrandRepository brandRepository;

    @Cacheable(value = "brands")
    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }

    @CacheEvict(value = "brands", allEntries = true)
    public Brand createBrand(Brand brand) {
        return brandRepository.save(brand);
    }

    @CacheEvict(value = "brands", allEntries = true)
    public boolean deleteBrand(Long id) {
        if (!brandRepository.existsById(id)) {
            return false;
        }
        brandRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "brands", allEntries = true)
    public Brand updateBrand(Long id, Brand newBrand) {
        Brand oldBrand = brandRepository.findById(id).orElse(null);
        if (oldBrand == null) return null;
        newBrand.setId(oldBrand.getId());
        return brandRepository.save(newBrand);
    }
}

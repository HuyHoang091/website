package com.game.Service;

import com.game.Model.Discount;
import com.game.Repository.DiscountRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class DiscountService {
    @Autowired
    private DiscountRepository discountRepository;

    @Cacheable(value = "discounts")
    public List<Discount> getAllDiscounts() {
        return discountRepository.findAll();
    }

    @CacheEvict(value = "discounts", allEntries = true)
    public Discount createDiscount(Discount discount) {
        return discountRepository.save(discount);
    }

    @CacheEvict(value = "discounts", allEntries = true)
    public boolean deleteDiscount(Long id) {
        if (!discountRepository.existsById(id)) {
            return false;
        }
        discountRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "discounts", allEntries = true)
    public Discount updateDiscount(Long id, Discount newDiscount) {
        Discount oldDiscount = discountRepository.findById(id).orElse(null);
        if (oldDiscount == null) return null;
        newDiscount.setDiscountId(oldDiscount.getDiscountId());
        return discountRepository.save(newDiscount);
    }
}

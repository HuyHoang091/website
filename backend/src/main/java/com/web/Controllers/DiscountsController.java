package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Discount;
import com.web.Service.DiscountService;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
public class DiscountsController {
    @Autowired
    private DiscountService discountService;

    @GetMapping("/")
    public List<Discount> getAllDiscounts() {
        return discountService.getAllDiscounts();
    }

    @PostMapping("/")
    public ResponseEntity<?> createDiscount(@RequestBody Discount discount) {
        try {
            Discount savedDiscount = discountService.createDiscount(discount);
            return new ResponseEntity<>(savedDiscount, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi thêm mã giảm giá: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiscountById(@PathVariable Long id) {
        try {
            Discount discount = discountService.getDiscountById(id);
            if (discount != null) {
                return new ResponseEntity<>(discount, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy mã giảm giá với ID: " + id, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi tìm mã giảm giá: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDiscount(@PathVariable Long id, @RequestBody Discount discount) {
        try {
            Discount updatedDiscount = discountService.updateDiscount(id, discount);
            if (updatedDiscount != null) {
                return new ResponseEntity<>(updatedDiscount, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy mã giảm giá với ID: " + id, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi cập nhật mã giảm giá: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscount(@PathVariable Long id) {
        try {
            boolean deleted = discountService.deleteDiscount(id);
            if (deleted) {
                return new ResponseEntity<>("Xóa mã giảm giá thành công", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy mã giảm giá với ID: " + id, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi xóa mã giảm giá: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

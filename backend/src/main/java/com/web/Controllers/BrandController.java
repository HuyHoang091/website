package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Brand;
import com.web.Service.BrandService;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {
    @Autowired
    private BrandService brandService;

    @GetMapping("/")
    public List<Brand> getAllBrands() {
        return brandService.getAllBrands();
    }
}

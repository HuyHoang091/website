package com.game.Controllers;

import com.game.Service.BrandService;
import com.game.Model.Brand;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

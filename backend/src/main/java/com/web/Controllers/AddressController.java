package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Address;
import com.web.Service.AddressService;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {
    @Autowired
    private AddressService addressService;

    @GetMapping("/user/{userId}")
    public List<Address> getAddressesByUserId(
            @PathVariable Long userId,
            @RequestParam(required = false) Boolean isDefault) {
        if (isDefault != null) {
            return addressService.getAddressByUserId(userId, isDefault);
        } else {
            return addressService.getAllAddressByUserId(userId);
        }
    }

    @GetMapping("/user/{userId}/all")
    public List<Address> getAllAddressesByUserId(@PathVariable Long userId) {
        return addressService.getAllAddressByUserId(userId);
    }
}

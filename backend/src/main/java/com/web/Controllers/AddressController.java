package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Address;
import com.web.Service.AddressService;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {
    @Autowired
    private AddressService addressService;

    @PostMapping("/create")
    public ResponseEntity<?> createAddress(@RequestBody Address address) {
        System.out.println("Received address: " + address);
        Address create = addressService.createAddress(address);
        if (create == null) {
            return ResponseEntity.badRequest().body("Invalid user ID");
        }
        return ResponseEntity.ok("Thêm địa chỉ thành công");
    }

    @GetMapping("/user/{userId}")
    public List<Address> getAddressesByUserId(@PathVariable Long userId) {
        return addressService.getAddressByUserId(userId, true);
    }

    @GetMapping("/user/{userId}/all")
    public List<Address> getAllAddressesByUserId(@PathVariable Long userId) {
        return addressService.getAllAddressByUserId(userId);
    }
}

package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Address;
import com.web.Repository.AddressRepository;

@Service
public class AddressService {
    @Autowired
    private AddressRepository addressRepository;

    @Cacheable(value = "addresses", key = "#userId")
    public List<Address> getAddressByUserId(Long userId) {
        return addressRepository.findByUser_Id(userId);
    }

    @CacheEvict(value = "addresses", key = "#address.user.id")
    public Address createAddress(Address address) {
        return addressRepository.save(address);
    }

    @CacheEvict(value = "addresses", key = "#userId")
    public boolean deleteAddress(Long id, Long userId) {
        Address address = addressRepository.findById(id).orElse(null);
        if (address == null || !address.getUser().getId().equals(userId)) {
            return false;
        }
        addressRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "addresses", key = "#newAddress.user.id")
    public Address updateAddress(Long id, Address newAddress) {
        Address oldAddress = addressRepository.findById(id).orElse(null);
        if (oldAddress == null) return null;
        newAddress.setId(oldAddress.getId());
        return addressRepository.save(newAddress);
    }
}

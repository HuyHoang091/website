package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Address;
import com.web.Model.User;
import com.web.Repository.AddressRepository;
import com.web.Repository.UserRepository;

@Service
public class AddressService {
    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Cacheable(value = "addresses", key = "#userId")
    public List<Address> getAddressByUserId(Long userId, Boolean isDefault) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return addressRepository.findByCustomerIdAndIsDefault(userId, isDefault);
        }
        return addressRepository.findByUser_IdAndIsDefault(userId, isDefault);
    }
    
    public List<Address> getAllAddressByUserId(Long userId) {
        return addressRepository.findByUser_Id(userId);
    }

    @CacheEvict(value = "addresses", key = "#address.user?.id")
    @Transactional
    public Address createAddress(Address address) {
        Long userId = (address.getUser() != null) ? address.getUser().getId() : null;

        if (userId == null) {
            return null;
        }

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            address.setCustomerId(userId);
            address.setUser(null);

            List<Address> list = addressRepository.findByCustomerIdAndIsDefault(userId, true);
            for (Address addr : list) {
                if (Boolean.TRUE.equals(addr.getIsDefault())) {
                    addr.setIsDefault(false);
                }
            }
            addressRepository.saveAll(list);
        } else {
            address.setUser(user);

            List<Address> list = addressRepository.findByUser_Id(userId);
            for (Address addr : list) {
                if (Boolean.TRUE.equals(addr.getIsDefault())) {
                    addr.setIsDefault(false);
                }
            }
            addressRepository.saveAll(list);
        }

        address.setIsDefault(true);

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

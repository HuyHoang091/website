package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Address;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser_Id(Long userId);
    List<Address> findByUser_IdAndIsDefault(Long userId, boolean isDefault);
    List<Address> findByCustomerIdAndIsDefault(Long customerId, boolean isDefault);
}

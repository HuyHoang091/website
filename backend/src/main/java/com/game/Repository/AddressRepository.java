package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.game.Model.Address;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser_Id(Long userId);
}

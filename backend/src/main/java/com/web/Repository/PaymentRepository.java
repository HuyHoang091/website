package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByOrder_Id(Long orderId);
}

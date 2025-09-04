package com.game.Service;

import com.game.Model.Payment;
import com.game.Repository.PaymentRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @Cacheable(value = "payment", key = "#orderId")
    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrder_Id(orderId);
    }

    @CacheEvict(value = "payment", key = "#payment.order.id")
    public Payment createPayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    @CacheEvict(value = "payment", key = "#orderId")
    public boolean deletePayment(Long id, Long orderId) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null || !payment.getOrder().getId().equals(orderId)) {
            return false;
        }
        paymentRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "payment", key = "#newPayment.order.id")
    public Payment updatePayment(Long id, Payment newPayment) {
        Payment oldPayment = paymentRepository.findById(id).orElse(null);
        if (oldPayment == null) return null;
        newPayment.setId(oldPayment.getId());
        return paymentRepository.save(newPayment);
    }
}

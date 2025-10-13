package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.Model.Payment;
import com.web.Repository.PaymentRepository;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrder_Id(orderId);
    }

    public Payment createPayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    public boolean deletePayment(Long id, Long orderId) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null || !payment.getOrder().getId().equals(orderId)) {
            return false;
        }
        paymentRepository.deleteById(id);
        return true;
    }

    @Transactional
    public Payment updatePayment(Long id, Payment newPayment) {
        Payment oldPayment = paymentRepository.findById(id).orElse(null);
        if (oldPayment == null) return null;
        newPayment.setId(oldPayment.getId());
        return paymentRepository.save(newPayment);
    }
}

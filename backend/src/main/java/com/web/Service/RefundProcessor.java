package com.web.Service;

import com.web.Dto.RefundMessageDto;
import com.web.Model.Order;
import com.web.Repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.logging.Logger;

@Service
public class RefundProcessor {

    private static final Logger logger = Logger.getLogger(RefundProcessor.class.getName());

    @Autowired
    private RefundQueueService refundQueueService;

    @Autowired
    private PayPalService payPalService;

    @Autowired
    private OrderRepository orderRepository;

    // Chạy mỗi 10 giây để xử lý các yêu cầu hoàn tiền
    @Scheduled(fixedRate = 10000)
    public void processRefundQueue() {
        RefundMessageDto refundMessage = refundQueueService.dequeueRefundRequest();

        if (refundMessage == null) {
            return;
        }

        logger.info("Processing refund for order: " + refundMessage.getOrderId());

        try {
            // Xử lý hoàn tiền
            String note = "Refund for order #" + refundMessage.getOrderId() + ". Reason: " + refundMessage.getReason();
            if (refundMessage.getAdminNote() != null && !refundMessage.getAdminNote().isEmpty()) {
                note += ". Admin note: " + refundMessage.getAdminNote();
            }

            Map<String, Object> refundResponse = payPalService.refundPayment(refundMessage.getCaptureId(), note);

            if (refundResponse != null && refundResponse.get("status") != null &&
                    refundResponse.get("status").toString().equalsIgnoreCase("COMPLETED")) {
                // Hoàn tiền thành công
                logger.info("Refund successful for order: " + refundMessage.getOrderId());
                refundQueueService.saveSuccessRefund(refundMessage, refundResponse);

                // Cập nhật trạng thái đơn hàng
                Order order = orderRepository.findById(refundMessage.getOrderId()).orElse(null);
                if (order != null) {
                    order.setStatus(Order.STATUS.returned);
                    orderRepository.save(order);
                }
            } else {
                // Hoàn tiền thất bại
                logger.warning("Refund failed for order: " + refundMessage.getOrderId());
                refundQueueService.saveFailedRefund(refundMessage,
                        refundResponse != null ? refundResponse.toString() : "Unknown error");
            }
        } catch (Exception e) {
            logger.severe("Error processing refund: " + e.getMessage());
            refundQueueService.saveFailedRefund(refundMessage, e.getMessage());
        }
    }
}
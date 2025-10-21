package com.web.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.web.Dto.RefundMessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class RefundQueueService {

    private static final String REFUND_QUEUE_KEY = "refund:queue";
    private static final String REFUND_PROCESSING_KEY = "refund:processing";
    private static final String REFUND_FAILED_KEY = "refund:failed";
    private static final String REFUND_SUCCESS_KEY = "refund:success";
    private static final String REFUND_ORDER_INDEX_KEY = "refund:order:index";

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private final ObjectMapper objectMapper;

    public RefundQueueService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // Thêm yêu cầu hoàn tiền vào hàng đợi
    public void enqueueRefundRequest(RefundMessageDto refundMessage) {
        try {
            String messageJson = objectMapper.writeValueAsString(refundMessage);
            redisTemplate.opsForList().rightPush(REFUND_QUEUE_KEY, messageJson);

            // Lưu index để tìm kiếm theo orderId
            redisTemplate.opsForHash().put(REFUND_ORDER_INDEX_KEY,
                    refundMessage.getOrderId().toString(), messageJson);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    // Lấy yêu cầu hoàn tiền từ hàng đợi
    public RefundMessageDto dequeueRefundRequest() {
        String messageJson = redisTemplate.opsForList().leftPop(REFUND_QUEUE_KEY);
        if (messageJson == null) {
            return null;
        }

        try {
            RefundMessageDto message = objectMapper.readValue(messageJson, RefundMessageDto.class);
            // Chuyển yêu cầu sang trạng thái đang xử lý
            message.setStatus("PROCESSING");
            saveProcessingRefund(message);
            return message;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return null;
        }
    }

    // Lưu yêu cầu đang xử lý
    public void saveProcessingRefund(RefundMessageDto refundMessage) {
        try {
            String messageJson = objectMapper.writeValueAsString(refundMessage);
            String key = REFUND_PROCESSING_KEY + ":" + refundMessage.getOrderId();
            redisTemplate.opsForValue().set(key, messageJson);
            redisTemplate.expire(key, 1, TimeUnit.HOURS); // Tự động xóa sau 1 giờ nếu không được xử lý
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    // Lưu yêu cầu hoàn tiền thất bại
    public void saveFailedRefund(RefundMessageDto refundMessage, String errorMessage) {
        try {
            refundMessage.setStatus("FAILED");
            Map<String, Object> messageWithError = new HashMap<>();
            messageWithError.put("refund", refundMessage);
            messageWithError.put("error", errorMessage);
            messageWithError.put("timestamp", System.currentTimeMillis());

            String messageJson = objectMapper.writeValueAsString(messageWithError);
            String key = REFUND_FAILED_KEY + ":" + refundMessage.getOrderId();
            redisTemplate.opsForValue().set(key, messageJson);

            // Xóa khỏi processing
            redisTemplate.delete(REFUND_PROCESSING_KEY + ":" + refundMessage.getOrderId());
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    // Lưu yêu cầu hoàn tiền thành công
    public void saveSuccessRefund(RefundMessageDto refundMessage, Map<String, Object> refundResponse) {
        try {
            refundMessage.setStatus("COMPLETED");
            Map<String, Object> messageWithResponse = new HashMap<>();
            messageWithResponse.put("refund", refundMessage);
            messageWithResponse.put("response", refundResponse);
            messageWithResponse.put("timestamp", System.currentTimeMillis());

            String messageJson = objectMapper.writeValueAsString(messageWithResponse);
            String key = REFUND_SUCCESS_KEY + ":" + refundMessage.getOrderId();
            redisTemplate.opsForValue().set(key, messageJson);

            // Xóa khỏi processing
            redisTemplate.delete(REFUND_PROCESSING_KEY + ":" + refundMessage.getOrderId());
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    // Lấy danh sách yêu cầu hoàn tiền thất bại
    public List<Map<String, Object>> getFailedRefunds() {
        List<Map<String, Object>> failedRefunds = new ArrayList<>();
        Set<String> keys = redisTemplate.keys(REFUND_FAILED_KEY + ":*");

        if (keys != null) {
            for (String key : keys) {
                String messageJson = redisTemplate.opsForValue().get(key);
                if (messageJson != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> refundData = objectMapper.readValue(messageJson, Map.class);
                        failedRefunds.add(refundData);
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        return failedRefunds;
    }

    // Lấy danh sách yêu cầu hoàn tiền thành công
    public List<Map<String, Object>> getSuccessRefunds() {
        List<Map<String, Object>> successRefunds = new ArrayList<>();
        Set<String> keys = redisTemplate.keys(REFUND_SUCCESS_KEY + ":*");

        if (keys != null) {
            for (String key : keys) {
                String messageJson = redisTemplate.opsForValue().get(key);
                if (messageJson != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> refundData = objectMapper.readValue(messageJson, Map.class);
                        successRefunds.add(refundData);
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        return successRefunds;
    }

    // Thử lại hoàn tiền thất bại
    public void retryFailedRefund(Long orderId) {
        String key = REFUND_FAILED_KEY + ":" + orderId;
        String messageJson = redisTemplate.opsForValue().get(key);

        if (messageJson != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> refundData = objectMapper.readValue(messageJson, Map.class);
                @SuppressWarnings("unchecked")
                Map<String, Object> refundMap = (Map<String, Object>) refundData.get("refund");

                RefundMessageDto refundMessage = objectMapper.convertValue(refundMap, RefundMessageDto.class);
                refundMessage.incrementRetryCount();
                refundMessage.setStatus("PENDING");

                // Xóa khỏi failed và đưa lại vào queue
                redisTemplate.delete(key);
                enqueueRefundRequest(refundMessage);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
    }

    // Xóa yêu cầu hoàn tiền
    public void deleteRefund(String type, Long orderId) {
        String key = "";
        switch (type) {
            case "failed":
                key = REFUND_FAILED_KEY + ":" + orderId;
                break;
            case "success":
                key = REFUND_SUCCESS_KEY + ":" + orderId;
                break;
            case "processing":
                key = REFUND_PROCESSING_KEY + ":" + orderId;
                break;
            default:
                return;
        }
        redisTemplate.delete(key);
    }
}
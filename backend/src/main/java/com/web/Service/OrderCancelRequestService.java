package com.web.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OrderCancelRequestService {

    private static final String KEY_PREFIX = "order_cancel_request:";
    private static final String ALL_REQUESTS_KEY = "all_cancel_requests";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Lưu yêu cầu hủy đơn hàng vào Redis
     */
    public boolean saveCancelRequest(Long orderId, String reason, String requestedBy) {
        try {
            String key = KEY_PREFIX + orderId;
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("orderId", orderId);
            requestData.put("reason", reason);
            requestData.put("requestedBy", requestedBy);
            requestData.put("requestTime", LocalDateTime.now().toString());

            // Lưu thông tin chi tiết vào key riêng
            String json = objectMapper.writeValueAsString(requestData);
            redisTemplate.opsForValue().set(key, json);

            // Thêm orderId vào danh sách tất cả yêu cầu
            redisTemplate.opsForSet().add(ALL_REQUESTS_KEY, orderId.toString());

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Lấy tất cả các yêu cầu hủy đơn
     */
    public List<Map<String, Object>> getAllCancelRequests() {
        List<Map<String, Object>> results = new ArrayList<>();
        try {
            Set<Object> allRequests = redisTemplate.opsForSet().members(ALL_REQUESTS_KEY);
            if (allRequests != null) {
                for (Object id : allRequests) {
                    String key = KEY_PREFIX + id.toString();
                    Object value = redisTemplate.opsForValue().get(key);
                    if (value != null) {
                        Map<String, Object> requestData = objectMapper.readValue(value.toString(), Map.class);
                        results.add(requestData);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return results;
    }

    /**
     * Lấy yêu cầu hủy đơn theo orderId
     */
    public Map<String, Object> getCancelRequest(Long orderId) {
        try {
            String key = KEY_PREFIX + orderId;
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return objectMapper.readValue(value.toString(), Map.class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Xóa yêu cầu hủy đơn khỏi Redis
     */
    public boolean removeCancelRequest(Long orderId) {
        try {
            String key = KEY_PREFIX + orderId;
            redisTemplate.delete(key);
            redisTemplate.opsForSet().remove(ALL_REQUESTS_KEY, orderId.toString());
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Kiểm tra đơn hàng có yêu cầu hủy hay không
     */
    public boolean hasCancelRequest(Long orderId) {
        String key = KEY_PREFIX + orderId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Lấy danh sách orderId có yêu cầu hủy từ danh sách orderId đầu vào
     */
    public List<Long> getOrdersWithCancelRequests(List<Long> orderIds) {
        List<Long> result = new ArrayList<>();

        for (Long orderId : orderIds) {
            if (hasCancelRequest(orderId)) {
                result.add(orderId);
            }
        }

        return result;
    }
}
package com.web.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserImageHistoryService {

    private static final String KEY_PREFIX = "user_image_history:";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Giữ 10 ảnh mới nhất; ảnh cũ hơn sẽ bị loại bỏ
    public void addProductImage(String userId, String productCode) {
        String key = KEY_PREFIX + userId;
        String entry = "Đã gửi ảnh mã " + productCode;

        // Push vào đầu danh sách và trim để giữ tối đa 10 phần tử (0..9)
        redisTemplate.opsForList().leftPush(key, entry);
        redisTemplate.opsForList().trim(key, 0, 9);
    }

    @SuppressWarnings("unchecked")
    public List<String> getUserImageHistory(String userId) {
        String key = KEY_PREFIX + userId;
        List<Object> raw = redisTemplate.opsForList().range(key, 0, -1);
        if (raw == null || raw.isEmpty()) return new ArrayList<>();
        return raw.stream().map(Object::toString).collect(Collectors.toList());
    }
}
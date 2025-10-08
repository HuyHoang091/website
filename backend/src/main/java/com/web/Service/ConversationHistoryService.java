package com.web.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ConversationHistoryService {

    private static final String KEY_PREFIX = "conv:"; // conv:{userId} -> list newest first
    private static final int MAX_ITEMS = 10;
    private static final DateTimeFormatter TF = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void addMessage(String userId, String role, String content) {
        if (userId == null)
            return;
        String key = KEY_PREFIX + userId;
        Map<String, Object> entry = new HashMap<>();
        entry.put("role", role == null ? "" : role);
        entry.put("content", content == null ? "" : content);

        // ensure key is list (if not, remove it) to avoid WRONGTYPE
        try {
            redisTemplate.execute((RedisCallback<Object>) connection -> {
                byte[] raw = redisTemplate.getStringSerializer().serialize(key);
                if (connection.exists(raw)) {
                    if (!connection.type(raw).name().equalsIgnoreCase("list")) {
                        connection.del(raw);
                    }
                }
                return null;
            });
        } catch (Exception ignored) {
        }

        redisTemplate.opsForList().leftPush(key, entry);
        redisTemplate.opsForList().trim(key, 0, MAX_ITEMS - 1);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getConversation(String userId) {
        String key = KEY_PREFIX + userId;
        List<Object> raw = redisTemplate.opsForList().range(key, 0, -1);
        if (raw == null)
            return List.of();
        return raw.stream().map(o -> {
            if (o instanceof Map)
                return (Map<String, Object>) o;
            Map<String, Object> m = new HashMap<>();
            m.put("role", "");
            m.put("content", String.valueOf(o));
            return m;
        }).collect(Collectors.toList());
    }
}
package com.web.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class FacebookMessageService {

    private final String PAGE_ACCESS_TOKEN = "EAAKYyZAgGETcBPmAVdFN4sRM5l4JO3nhYqxoypCZCTMqyWvVnOayaGzDXNwHCSN28zhTO1UidTJrubT4Eg7Y6gbe8GCc5PijrdjktHRzXjZAgZAZBHFkVtKEkpO1iIo7XjQGMSwt2NQsVbY8rPU7FWdZC5jV4rm1rz0U5LpmZANTL5LrlEmpYnvpr1yav4lxUZCr0f8bsAZDZD";

    @Autowired
    private RestTemplate restTemplate;

    public String sendMessageToFB(String recipientId, String text) {
        try {
            // Bỏ tiền tố "fb:" nếu có
            if (recipientId.startsWith("fb:")) {
                recipientId = recipientId.substring(3);
            }

            String url = "https://graph.facebook.com/v23.0/me/messages?access_token=" + PAGE_ACCESS_TOKEN;

            Map<String, Object> message = new HashMap<>();
            message.put("text", text);

            Map<String, Object> payload = new HashMap<>();
            payload.put("recipient", Map.of("id", recipientId));
            payload.put("messaging_type", "RESPONSE");
            payload.put("message", message);

            return restTemplate.postForObject(url, payload, String.class);
        } catch (Exception e) {
            System.err.println("Lỗi gửi tin nhắn Facebook: " + e.getMessage());
            return null;
        }
    }

    public String fetchFacebookUserName(String psid) {
        try {
            String url = "https://graph.facebook.com/v23.0/me/conversations?fields=participants&access_token="
                    + PAGE_ACCESS_TOKEN;

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("data")) {
                var conversations = (Iterable<Map<String, Object>>) response.get("data");
                for (Map<String, Object> conversation : conversations) {
                    var participants = (Iterable<Map<String, Object>>) ((Map<String, Object>) conversation
                            .get("participants")).get("data");
                    for (Map<String, Object> participant : participants) {
                        if (psid.equals(participant.get("id"))) {
                            return (String) participant.get("name");
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi lấy tên người dùng Facebook: " + e.getMessage());
        }
        return "Facebook User";
    }
}
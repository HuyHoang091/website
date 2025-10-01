package com.game.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;
import java.security.Principal;
import java.text.DateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import com.game.Model.Chat;
import com.game.Repository.ChatRepository;

@RestController
public class FacebookWebhookController {

    private final String PAGE_ACCESS_TOKEN = "EAAKYyZAgGETcBPXFZAyMzmy43UC01Wc5ZCX9vIJZA15zxfKy6vMZCwpa5ySOQu9xgGwyzZBZA9MkIwGqx22nIKJey0ZCxCeBhZBoLznLBi7NcQAoE8BaffAxqJnIvvNdHVhpDD3b9WlMVuusdEvubDI2KL3p2h66ES1w0cvZCFNzYZAhfUf8QErDRzYdslbmsvcQ3z9xRk5TQZDZD";
    private final String VERIFY_TOKEN = "0917834505";

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatRepository chatRepository;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

    // Verify webhook
    @GetMapping("/fb/webhook")
    public ResponseEntity<String> verify(@RequestParam("hub.mode") String mode,
                                         @RequestParam("hub.challenge") String challenge,
                                         @RequestParam("hub.verify_token") String token) {
        if ("subscribe".equals(mode) && VERIFY_TOKEN.equals(token)) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.status(403).body("Forbidden");
        }
    }

    // Receive messages from Facebook
    @PostMapping("/fb/webhook")
    public ResponseEntity<String> receive(@RequestBody Map<String, Object> payload) {
        if ("page".equals(payload.get("object"))) {
            var entries = (Iterable<Map<String, Object>>) payload.get("entry");
            for (Map<String, Object> entry : entries) {
                var messagingList = (Iterable<Map<String, Object>>) entry.get("messaging");
                for (Map<String, Object> msgObj : messagingList) {
                    Map<String, Object> sender = (Map<String, Object>) msgObj.get("sender");
                    String senderId = (String) sender.get("id");

                    Map<String, Object> message = (Map<String, Object>) msgObj.get("message");
                    if (message != null && message.get("text") != null) {
                        String text = (String) message.get("text");
                        System.out.println("FB message: " + text);

                        // Lưu vào Chat entity
                        Chat chat = new Chat();
                        chat.setFromUser("fb:" + senderId);
                        chat.setFromName("FB User");
                        chat.setToUser("saler");
                        chat.setContent(text);
                        chat.setType(Chat.TYPE.message);
                        chat.setStatus(Chat.STATUS.SENT);
                        chat.setCreatedAt(LocalDateTime.now());

                        Chat savedChat = chatRepository.save(chat);

                        // Push qua WebSocket tới tất cả sale
                        // Giống userMessage
                        // Map giống response bạn đang dùng
                        Map<String, Object> response = Map.of(
                                "id", savedChat.getId(),
                                "from", savedChat.getFromUser(),
                                "type", savedChat.getType().toString(),
                                "content", savedChat.getContent(),
                                "createdAt", savedChat.getCreatedAt().format(formatter)
                        );
                        messagingTemplate.convertAndSend("/queue/sale", response);

                        // Tự động reply FB
                        sendMessageToFB(senderId, "Cảm ơn bạn, chúng tôi đã nhận tin nhắn: " + text);
                    }
                }
            }
            return ResponseEntity.ok("EVENT_RECEIVED");
        } else {
            return ResponseEntity.status(404).body("Not Found");
        }
    }

    private void sendMessageToFB(String recipientId, String text) {
        String url = "https://graph.facebook.com/v15.0/me/messages?access_token=" + PAGE_ACCESS_TOKEN;
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> payload = Map.of(
                "recipient", Map.of("id", recipientId),
                "message", Map.of("text", text)
        );
        restTemplate.postForObject(url, payload, String.class);
    }
}

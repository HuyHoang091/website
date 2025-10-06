package com.game.Controllers;

import com.game.Model.Chat;
import com.game.Model.Customer;
import com.game.Model.UserAISettings;
import com.game.Repository.ChatRepository;
import com.game.Repository.CustomerRepository;
import com.game.Repository.UserAISettingsRepository;
import com.game.Service.ConversationHistoryService;
import com.game.Service.FacebookMessageService;
import com.game.Service.UserImageHistoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

@RestController
public class FacebookWebhookController {

    private final String VERIFY_TOKEN = "0917834505";

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private WebSocketController webSocketController;

    @Autowired
    private FacebookMessageService facebookMessageService;

    @Autowired
    private ConversationHistoryService conversationHistoryService;

    @Autowired
    private UserAISettingsRepository userAISettingsRepository;

    @Autowired
    private UserImageHistoryService userImageHistoryService;

    @Autowired
    private RestTemplate restTemplate;

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
        try {
            if ("page".equals(payload.get("object"))) {
                var entries = (Iterable<Map<String, Object>>) payload.get("entry");
                for (Map<String, Object> entry : entries) {
                    // Meta API v23 format
                    var messagingList = (Iterable<Map<String, Object>>) entry.get("messaging");
                    if (messagingList == null)
                        continue;

                    for (Map<String, Object> msgObj : messagingList) {
                        Map<String, Object> sender = (Map<String, Object>) msgObj.get("sender");
                        String senderId = (String) sender.get("id");
                        String fbUserId = "fb:" + senderId;

                        // Kiểm tra và lấy tên người dùng nếu cần
                        String userName = "Facebook User";
                        Customer customer = customerRepository.findByPsid(senderId).orElse(null);
                        if (customer == null) {
                            userName = facebookMessageService.fetchFacebookUserName(senderId);
                            Customer newCustomer = new Customer();
                            newCustomer.setPsid(senderId);
                            newCustomer.setName(userName);
                            newCustomer.setSource("facebook");
                            customerRepository.save(newCustomer);
                        } else {
                            userName = customer.getName();
                        }

                        Map<String, Object> message = (Map<String, Object>) msgObj.get("message");
                        if (message != null) {
                            // Xử lý tin nhắn văn bản
                            if (message.get("text") != null) {
                                String text = (String) message.get("text");
                                System.out.println("FB message: " + text + " from " + userName);

                                // Lưu vào Chat entity
                                Chat chat = new Chat();
                                chat.setFromUser(fbUserId);
                                chat.setFromName(userName);
                                chat.setToUser("saler");
                                chat.setToName("");
                                chat.setContent(text);
                                chat.setType(Chat.TYPE.message);
                                chat.setStatus(Chat.STATUS.SENT);
                                chat.setCreatedAt(LocalDateTime.now());
                                Chat savedChat = chatRepository.save(chat);

                                // Lưu vào Redis conversation history
                                conversationHistoryService.addMessage(fbUserId, userName, text);

                                // Push qua WebSocket tới tất cả sale giống hệt như userMessage trong
                                // WebSocketController
                                Map<String, Object> msgForSales = new HashMap<>();
                                msgForSales.put("id", savedChat.getId());
                                msgForSales.put("from", savedChat.getFromUser());
                                msgForSales.put("fromName", userName);
                                msgForSales.put("type", savedChat.getType().toString());
                                msgForSales.put("content", savedChat.getContent());
                                msgForSales.put("createdAt", savedChat.getCreatedAt().format(formatter));

                                // Gửi tin nhắn và cập nhật danh sách chat
                                webSocketController.sendToAllSales("/queue/sale", msgForSales);
                                webSocketController.sendToAllSales("/queue/sale/listchat", Map.of(
                                        "to", fbUserId,
                                        "content", userName + ": " + text,
                                        "createdAt", savedChat.getCreatedAt().format(formatter)));

                                boolean aiMode = false;
                                try {
                                    UserAISettings settings = userAISettingsRepository.findById(fbUserId)
                                            .orElse(new UserAISettings(fbUserId, false));
                                    aiMode = settings.isAiEnabled();
                                } catch (Exception e) {
                                    System.err.println("Lỗi khi lấy AI settings: " + e.getMessage());
                                }

                                // Gọi AI nếu được bật - dùng direct call không streaming
                                if (aiMode) {
                                    handleFacebookAI(fbUserId, userName, text);
                                }
                            }
                            // Xử lý đính kèm (nếu có)
                            else if (message.containsKey("attachments")) {
                                var attachments = (Iterable<Map<String, Object>>) message.get("attachments");
                                for (Map<String, Object> attachment : attachments) {
                                    String type = (String) attachment.get("type");

                                    if ("image".equals(type)) {
                                        Map<String, Object> payload1 = (Map<String, Object>) attachment.get("payload");
                                        String url = (String) payload1.get("url");

                                        // Lưu vào Chat entity
                                        Chat chat = new Chat();
                                        chat.setFromUser(fbUserId);
                                        chat.setFromName(userName);
                                        chat.setToUser("saler");
                                        chat.setToName("");
                                        chat.setContent(url);
                                        chat.setType(Chat.TYPE.image);
                                        chat.setStatus(Chat.STATUS.SENT);
                                        chat.setCreatedAt(LocalDateTime.now());
                                        Chat savedChat = chatRepository.save(chat);

                                        webSocketController.processImageSearch(fbUserId, url);

                                        // Push qua WebSocket tới tất cả sale
                                        Map<String, Object> msgForSales = new HashMap<>();
                                        msgForSales.put("id", savedChat.getId());
                                        msgForSales.put("from", savedChat.getFromUser());
                                        msgForSales.put("fromName", userName);
                                        msgForSales.put("type", savedChat.getType().toString());
                                        msgForSales.put("content", savedChat.getContent());
                                        msgForSales.put("createdAt", savedChat.getCreatedAt().format(formatter));

                                        webSocketController.sendToAllSales("/queue/sale", msgForSales);
                                        webSocketController.sendToAllSales("/queue/sale/listchat", Map.of(
                                                "to", fbUserId,
                                                "content", userName + ": Đã gửi 1 ảnh",
                                                "createdAt", savedChat.getCreatedAt().format(formatter)));
                                    }
                                }
                            }
                        }
                    }
                }
                return ResponseEntity.ok("EVENT_RECEIVED");
            }
        } catch (Exception e) {
            System.err.println("Lỗi xử lý webhook Facebook: " + e.getMessage());
            e.printStackTrace();
        }
        return ResponseEntity.status(404).body("Not Found");
    }

    // Thêm phương thức mới để xử lý AI cho Facebook (không streaming)
    private void handleFacebookAI(String userId, String userName, String question) {
        try {
            // 1. Lấy danh sách ảnh đã lưu trong Redis
            List<String> imgList = userImageHistoryService.getUserImageHistory(userId);
            if (imgList == null) imgList = List.of();
            Collections.reverse(imgList); // oldest -> newest
            
            // 2. Gộp thành một entry
            List<Map<String, String>> imgEntries = new ArrayList<>();
            if (!imgList.isEmpty()) {
                String content = String.join(", ", imgList);
                imgEntries.add(Map.of("role", "Ảnh khách gửi", "content", content));
            }
            
            // 3. Lấy lịch sử hội thoại
            List<Map<String, Object>> rawHistory = conversationHistoryService.getConversation(userId);
            if (rawHistory == null) rawHistory = List.of();
            Collections.reverse(rawHistory);
            
            List<Map<String, String>> convoEntries = rawHistory.stream()
                    .map(m -> Map.of(
                            "role", String.valueOf(m.getOrDefault("role", "")),
                            "content", String.valueOf(m.getOrDefault("content", ""))
                    ))
                    .collect(Collectors.toList());
            
            // 4. Tổng hợp history
            List<Map<String, String>> chatHistory = new ArrayList<>();
            if (!imgEntries.isEmpty()) chatHistory.addAll(imgEntries);
            if (!convoEntries.isEmpty()) chatHistory.addAll(convoEntries);
            
            // 5. Gọi API trực tiếp không streaming
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // region Bỏ khi debug xong
            // if(!chatHistory.isEmpty()) {
            //     System.out.println("Chat: " + chatHistory);
            //     return; // không có lịch sử thì thôi
            // }
            
            Map<String, Object> requestBody = Map.of(
                    "question", question,
                    "stream", false,
                    "chat_history", chatHistory
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://localhost:8001/chat",
                    entity,
                    Map.class
            );

            // 6. Xử lý phản hồi
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String aiResponse = (String) response.getBody().get("answer");

                System.out.println("AI response for FB: " + aiResponse);
                
                if (aiResponse != null && !aiResponse.isBlank()) {
                    // Lưu vào Chat entity
                    Chat chat = new Chat();
                    chat.setFromUser("saler");
                    chat.setFromName("AI Assistant");
                    chat.setToUser(userId);
                    chat.setToName(userName);
                    chat.setContent(aiResponse);
                    chat.setType(Chat.TYPE.message);
                    chat.setStatus(Chat.STATUS.SENDING); // Ban đầu là SENDING
                    chat.setCreatedAt(LocalDateTime.now());
                    Chat saved = chatRepository.save(chat);
                    
                    // Lưu vào lịch sử hội thoại
                    conversationHistoryService.addMessage(userId, "Tôi", aiResponse);
                    
                    // Gửi tin nhắn đến Facebook
                    String fbResult = facebookMessageService.sendMessageToFB(userId, aiResponse);
                    
                    // Cập nhật trạng thái
                    saved.setStatus(fbResult != null ? Chat.STATUS.SENT : Chat.STATUS.SENDING);
                    chatRepository.save(saved);
                    
                    // Thông báo cho tất cả sale
                    webSocketController.sendToAllSales("/queue/sale", Map.of(
                            "id", saved.getId(),
                            "from", userId,
                            "fromName", "AI Assistant",
                            "type", saved.getType().toString(),
                            "content", saved.getContent(),
                            "status", saved.getStatus().toString(),
                            "createdAt", saved.getCreatedAt().format(formatter),
                            "aiResponse", true
                    ));
                    
                    webSocketController.sendToAllSales("/queue/sale/listchat", Map.of(
                            "to", userId,
                            "content", "AI Assistant: " + (aiResponse.length() > 30 
                                    ? aiResponse.substring(0, 30) + "..." 
                                    : aiResponse),
                            "createdAt", saved.getCreatedAt().format(formatter)
                    ));
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi xử lý AI cho Facebook: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
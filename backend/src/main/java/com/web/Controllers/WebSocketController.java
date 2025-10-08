package com.web.Controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.web.Model.Chat;
import com.web.Model.UserAISettings;
import com.web.Repository.ChatRepository;
import com.web.Repository.UserAISettingsRepository;
import com.web.Service.ConversationHistoryService;
import com.web.Service.FacebookMessageService;
import com.web.Service.UserImageHistoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private WebClient.Builder webClientBuilder;
    // Thêm repository mới
    @Autowired
    private UserAISettingsRepository userAISettingsRepository;

    @Autowired
    private UserImageHistoryService userImageHistoryService;

    @Autowired
    private ConversationHistoryService conversationHistoryService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private FacebookMessageService facebookMessageService;

    // RestTemplate bean moved to com.game.Config.RestConfig

    private final ConcurrentHashMap<String, String> saleMap = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");

    @MessageMapping("/registerSale")
    public void registerSale(Principal p) {
        saleMap.put(p.getName(), "SALE");
        messagingTemplate.convertAndSendToUser(p.getName(), "/queue/sale", "Welcome sale: " + p.getName());
        System.out.println("Sale connected: " + p.getName());
    }

    @MessageMapping("/userMessage")
    public void handleUserMessage(@Payload Map<String, String> payload, Principal principal) {
        String from = payload.get("from");
        String fromName = payload.get("fromName");
        String type = payload.get("type");
        String content = payload.get("content");
        String clientId = payload.get("clientId");

        // Bỏ aiMode từ payload và lấy từ database
        boolean aiMode = false;
        try {
            UserAISettings settings = userAISettingsRepository.findById(from)
                    .orElse(new UserAISettings(from, false));
            aiMode = settings.isAiEnabled();
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy AI settings: " + e.getMessage());
        }

        // Kiểm tra nếu là ảnh, gửi để tìm kiếm
        if ("image".equals(type)) {
            // Xử lý song song - không chờ
            processImageSearch(from, content);
        }

        // Phần còn lại giữ nguyên
        Chat c = new Chat();
        c.setFromUser(from);
        c.setFromName(fromName);
        c.setToUser("saler");
        c.setToName("");
        c.setContent(content);
        c.setType(Chat.TYPE.valueOf(type));
        c.setStatus(Chat.STATUS.SENT);
        c.setCreatedAt(LocalDateTime.now());
        Chat saved = chatRepository.save(c);

        // lưu vào lịch sử hội thoại (user gửi): role = user name
        if(!type.equals("image")) {
            conversationHistoryService.addMessage(from, fromName == null || fromName.isBlank() ? from : fromName, content);
        }

        Map<String, Object> msgForSales = Map.of(
                "id", saved.getId(),
                "from", saved.getFromUser(),
                "type", saved.getType().toString(),
                "content", saved.getContent(),
                "createdAt", saved.getCreatedAt().format(fmt));

        Map<String, Object> ackForUser = Map.of(
                "id", saved.getId(),
                "clientId", clientId,
                "status", saved.getStatus().toString(),
                "createdAt", saved.getCreatedAt().format(fmt));

        sendToAllSales("/queue/sale", msgForSales);
        sendToAllSales("/queue/sale/listchat", Map.of(
                "to", saved.getFromUser(),
                "content",
                saved.getType().toString().equals("image") ? fromName + ": Đã gửi 1 ảnh"
                        : fromName + ": " + saved.getContent(),
                "createdAt", saved.getCreatedAt().format(fmt)));

        messagingTemplate.convertAndSendToUser(from, "/queue/user", ackForUser);

        if (aiMode && !"image".equals(type))
            handleAIChat(from, fromName, content, clientId);
    }

    @MessageMapping("/saleMessage")
    public void handleSaleMessage(@Payload Map<String, String> payload, Principal principal) {
        String to = payload.get("to");
        if (to == null)
            return;

        String toName = payload.get("toName");
        String type = payload.get("type");
        String content = payload.get("content");
        String clientId = payload.get("clientId");
        boolean aiMode = Boolean.parseBoolean(payload.getOrDefault("aiMode", "false"));

        if (aiMode) {
            handleAIChat(to, toName, content, clientId);
            return;
        }

        // region Kiểm tra nếu user là từ Facebook (bắt đầu bằng "fb:")
        if (to.startsWith("fb:")) {
            Chat c = new Chat();
            c.setFromUser("saler");
            c.setFromName("");
            c.setToUser(to);
            c.setToName(toName);
            c.setContent(content);
            c.setType(Chat.TYPE.valueOf(type));
            c.setStatus(Chat.STATUS.SENDING);
            c.setCreatedAt(LocalDateTime.now());
            Chat saved = chatRepository.save(c);

            String response = facebookMessageService.sendMessageToFB(to, content);
            
            Chat.STATUS status = response != null ? Chat.STATUS.SENT : Chat.STATUS.SENDING;
            saved.setStatus(status);
            chatRepository.save(saved);

            if (!type.equals("image")) {
                conversationHistoryService.addMessage(to, "Tôi", content);
            }

            sendToAllSales("/queue/sale", Map.of(
                    "id", saved.getId(),
                    "clientId", clientId,
                    "status", saved.getStatus(),
                    "createdAt", saved.getCreatedAt().format(fmt)));
            
            sendToAllSales("/queue/sale/listchat", Map.of(
                    "to", saved.getToUser(),
                    "content", saved.getType().toString().equals("image") ? 
                            "Saler: Đã gửi 1 ảnh" : "Saler: " + saved.getContent(),
                    "createdAt", saved.getCreatedAt().format(fmt)));
            return;
        }

        Chat c = new Chat();
        c.setFromUser("saler");
        c.setFromName("");
        c.setToUser(to);
        c.setToName(toName);
        c.setContent(content);
        c.setType(Chat.TYPE.valueOf(type));
        c.setStatus(Chat.STATUS.SENT);
        c.setCreatedAt(LocalDateTime.now());
        Chat saved = chatRepository.save(c);

        // lưu vào lịch sử hội thoại (saler gửi): role = "Tôi"
        if(!type.equals("image")) {
            conversationHistoryService.addMessage(to, "Tôi", content);
        }

        messagingTemplate.convertAndSendToUser(to, "/queue/user", Map.of(
                "id", saved.getId(),
                "type", saved.getType().toString(),
                "content", saved.getContent(),
                "status", saved.getStatus().toString(),
                "createdAt", saved.getCreatedAt().format(fmt)));

        sendToAllSales("/queue/sale", Map.of(
                "id", saved.getId(),
                "clientId", clientId,
                "status", saved.getStatus(),
                "createdAt", saved.getCreatedAt().format(fmt)));
        sendToAllSales("/queue/sale/listchat", Map.of(
                "to", saved.getToUser(),
                "content",
                saved.getType().toString().equals("image") ? "Saler: Đã gửi 1 ảnh" : "Saler: " + saved.getContent(),
                "createdAt", saved.getCreatedAt().format(fmt)));
    }

    private void handleAIChat(String to, String toName, String question, String clientId) {
        System.out.println("AI chat for user: " + to);
        StringBuilder full = new StringBuilder();
        WebClient client = webClientBuilder.baseUrl("http://localhost:8001").build();

        // Lấy danh sách ảnh đã lưu trong Redis và biên soạn thành các entry đầu tiên
        List<String> imgList = userImageHistoryService.getUserImageHistory(to); // newest-first
        if (imgList == null) imgList = List.of();
        Collections.reverse(imgList); // oldest -> newest
        List<Map<String, String>> imgEntries = new java.util.ArrayList<>();
        if (!imgList.isEmpty()) {
            String content = String.join(", ", imgList);
            imgEntries.add(Map.of("role", "Ảnh khách gửi", "content", content));
        }

        // Lấy lịch sử hội thoại từ Redis (ConversationHistoryService trả về newest-first), đảo để chronological
        List<Map<String, Object>> rawHistory = conversationHistoryService.getConversation(to);
        if (rawHistory == null) rawHistory = List.of();
        Collections.reverse(rawHistory);
        List<Map<String, String>> convoEntries = rawHistory.stream().map(m -> Map.of(
                        "role", String.valueOf(m.getOrDefault("role", "")),
                        "content", String.valueOf(m.getOrDefault("content", ""))
                ))
                .collect(Collectors.toList());

        // Tổng hợp: ảnh (nếu có) trước, sau đó toàn bộ hội thoại
        List<Map<String, String>> chatHistory = new java.util.ArrayList<>();
        if (!imgEntries.isEmpty()) chatHistory.addAll(imgEntries);
        if (!convoEntries.isEmpty()) chatHistory.addAll(convoEntries);

        // region Xóa khi debug xong
        // System.out.println("Chat: " + chatHistory);
        // if(!chatHistory.isEmpty()) {
        //     return;
        // }

        client.post()
                .uri("/chat")
                .bodyValue(Map.of("question", question, "stream", true, "chat_history", chatHistory))
                .retrieve()
                .bodyToFlux(String.class)
                .map(this::extractToken)
                .doOnNext(token -> {
                    if (token == null || token.isEmpty())
                        return;
                    // stream to user (partial)
                    messagingTemplate.convertAndSendToUser(to, "/queue/user", Map.of(
                            "type", "text", "content", token, "partial", true));
                    // stream to sales (partial, aiResponse flag)
                    sendToAllSales("/queue/sale", Map.of(
                            "from", to, "fromName", "AI Assistant", "type", "text",
                            "content", token, "partial", true, "aiResponse", true));
                    full.append(token);
                })
                .doOnError(e -> {
                    System.err.println("AI error: " + e.getMessage());
                    messagingTemplate.convertAndSendToUser(to, "/queue/user", Map.of(
                            "type", "text", "content", "AI service unavailable", "status", "ERROR",
                            "createdAt", LocalDateTime.now().format(fmt)));
                })
                .doOnComplete(() -> {
                    if (full.length() == 0) {
                        messagingTemplate.convertAndSendToUser(to, "/queue/user", Map.of(
                                "type", "text", "content", "AI returned empty", "status", "ERROR",
                                "createdAt", LocalDateTime.now().format(fmt)));
                        return;
                    }
                    Chat chat = new Chat();
                    chat.setFromUser("saler");
                    chat.setFromName("AI Assistant");
                    chat.setToUser(to);
                    chat.setToName((toName == null || toName.trim().isEmpty()) ? "Khách hàng" : toName);
                    chat.setContent(full.toString());
                    chat.setType(Chat.TYPE.message);
                    chat.setStatus(Chat.STATUS.SENT);
                    chat.setCreatedAt(LocalDateTime.now());
                    Chat saved = chatRepository.save(chat);

                    // lưu AI trả lời vào lịch sử hội thoại
                    conversationHistoryService.addMessage(to, "Tôi", saved.getContent());

                    // final message to user
                    messagingTemplate.convertAndSendToUser(to, "/queue/user", Map.of(
                            "id", saved.getId(), "type", "text", "content", saved.getContent(),
                            "status", saved.getStatus().toString(), "fromName", "AI Assistant",
                            "createdAt", saved.getCreatedAt().format(fmt)));

                    // final message + listchat update to sales
                    sendToAllSales("/queue/sale", Map.of(
                            "id", saved.getId(), "from", to, "fromName", "AI Assistant",
                            "type", saved.getType().toString(), "content", saved.getContent(),
                            "status", saved.getStatus().toString(), "createdAt", saved.getCreatedAt().format(fmt),
                            "aiResponse", true));
                    sendToAllSales("/queue/sale/listchat", Map.of(
                            "to", to, "content",
                            "AI Assistant: "
                                    + (saved.getContent().length() > 30 ? saved.getContent().substring(0, 30) + "..."
                                            : saved.getContent()),
                            "createdAt", saved.getCreatedAt().format(fmt)));
                })
                .subscribe();
    }

    public void sendToAllSales(String destination, Object payload) {
        saleMap.keySet().forEach(sale -> messagingTemplate.convertAndSendToUser(sale, destination, payload));
    }

    private String extractToken(String line) {
        if (line == null || line.isBlank())
            return "";
        try {
            String s = line.trim();
            if (s.startsWith("data:"))
                s = s.substring(5).trim();
            if (s.isEmpty())
                return "";
            JsonNode n = mapper.readTree(s);
            String type = n.path("type").asText("");
            if ("token".equals(type))
                return n.path("content").asText("");
            return "";
        } catch (Exception e) {
            System.err.println("parse token failed: " + line);
            return "";
        }
    }

    @PostConstruct
    public void checkAIService() {
        try {
            webClientBuilder.baseUrl("http://localhost:8001").build()
                    .get().uri("/health").retrieve().toEntity(String.class)
                    .timeout(Duration.ofSeconds(5)).block();
            System.out.println("AI service reachable");
        } catch (Exception e) {
            System.err.println("AI service not reachable: " + e.getMessage());
        }
    }

    public void processImageSearch(String userId, String imageUrl) {
        // Xử lý asynchronously để không block thread chính
        CompletableFuture.runAsync(() -> {
            try {
                // 1. Tải ảnh về từ URL
                Path tempFile = downloadImage(imageUrl);

                // 2. Gửi ảnh đến API tìm kiếm
                String productCode = searchImage(tempFile);

                // 3. Xóa file tạm sau khi sử dụng
                Files.deleteIfExists(tempFile);

                // 4. Lưu kết quả vào Redis nếu tìm được sản phẩm
                if (productCode != null && !productCode.isEmpty()) {
                    userImageHistoryService.addProductImage(userId, productCode);

                    // 5. Thông báo cho sale về sản phẩm tìm được
                    // notifySaleAboutFoundProduct(userId, productCode);
                }
            } catch (Exception e) {
                System.err.println("Lỗi khi xử lý tìm kiếm ảnh: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    private Path downloadImage(String imageUrl) throws Exception {
        URL url = new URL(imageUrl);
        String fileName = "temp_" + UUID.randomUUID().toString() + ".jpg";
        Path tempFile = Paths.get(System.getProperty("java.io.tmpdir"), fileName);

        try (InputStream in = url.openStream()) {
            Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
        }

        return tempFile;
    }

    private String searchImage(Path imagePath) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            Resource imageResource = new FileSystemResource(imagePath.toFile());
            body.add("file", imageResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://localhost:8000/search/",
                    requestEntity,
                    Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");

                if (results != null && !results.isEmpty()) {
                    // Lấy mã sản phẩm đầu tiên
                    String productId = (String) results.get(0).get("product_id");
                    System.out.println("Tìm thấy sản phẩm: " + productId);
                    return productId;
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi API tìm kiếm: " + e.getMessage());
        }

        return null;
    }

    // private void notifySaleAboutFoundProduct(String userId, String productCode) {
    // sendToAllSales("/queue/sale/product", Map.of(
    // "userId", userId,
    // "productCode", productCode,
    // "timestamp",
    // LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));

    // // Gửi thông báo trên list chat
    // sendToAllSales("/queue/sale/listchat", Map.of(
    // "to", userId,
    // "content", "🔍 Đã tìm thấy sản phẩm: " + productCode,
    // "createdAt", LocalDateTime.now().format(fmt),
    // "system", true));
    // }
}
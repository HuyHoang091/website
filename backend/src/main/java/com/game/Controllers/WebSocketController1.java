// package com.game.Controllers;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.messaging.handler.annotation.*;
// import org.springframework.messaging.simp.SimpMessagingTemplate;
// import org.springframework.stereotype.Controller;

// import java.util.concurrent.ConcurrentHashMap;
// import java.security.Principal;
// import java.text.DateFormat;
// import java.time.LocalDateTime;
// import java.time.format.DateTimeFormatter;
// import java.util.Map;

// import com.game.Model.Chat;
// import com.game.Repository.ChatRepository;

// @Controller
// public class WebSocketController1 {

//     @Autowired
//     private SimpMessagingTemplate messagingTemplate;

//     @Autowired
//     private ChatRepository chatRepository;

//     private final Map<String, String> saleMap = new ConcurrentHashMap<>();

//     private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

//     @MessageMapping("/registerSale")
//     public void registerSale(Principal principal) {
//         saleMap.put(principal.getName(), "SALE");
//         System.out.println("Sale connected: " + principal.getName());
//         messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/sale", "Welcome sale: " + principal.getName());
//     }

//     @MessageMapping("/userMessage")
//     public void handleUserMessage(@Payload Map<String, String> payload, Principal principal) {
//         String from = payload.get("from");
//         String fromName = payload.get("fromName");
//         String type = payload.get("type");
//         String content = payload.get("content");
//         String clientId = payload.get("clientId");

//         Chat chat = new Chat();
//         chat.setFromUser(from);
//         chat.setFromName(fromName);
//         chat.setToUser("saler");
//         chat.setToName("");
//         chat.setContent(content);
//         chat.setType(Chat.TYPE.valueOf(type));
//         chat.setStatus(Chat.STATUS.SENT);
//         chat.setCreatedAt(LocalDateTime.now());

//         Chat savedChat = chatRepository.save(chat);

//         Map<String, Object> response = Map.of(
//             "id", savedChat.getId(),
//             "from", savedChat.getFromUser(),
//             "type", savedChat.getType().toString(),
//             "content", savedChat.getContent(),
//             "createdAt", savedChat.getCreatedAt().format(formatter)
//         );

//         Map<String, Object> response1 = Map.of(
//             "id", savedChat.getId(),
//             "clientId", clientId,
//             "status", savedChat.getStatus().toString(),
//             "createdAt", savedChat.getCreatedAt().format(formatter)
//         );

//         // Gửi cho toàn bộ Sale
//         for (String salePrincipal : saleMap.keySet()) {
//             messagingTemplate.convertAndSendToUser(salePrincipal, "/queue/sale", response);
//         }

//         // Gửi lại cho chính User
//         messagingTemplate.convertAndSendToUser(from, "/queue/user", response1);
//     }

//     @MessageMapping("/saleMessage")
//     public void handleSaleMessage(@Payload Map<String, String> payload, Principal principal) {
//         String to = payload.get("to");
//         String toName = payload.get("toName");
//         String type = payload.get("type");
//         String content = payload.get("content");
//         String clientId = payload.get("clientId");

//         if (to != null) {
//             Chat chat = new Chat();
//             chat.setFromUser("saler");
//             chat.setFromName("");
//             chat.setToUser(to);
//             chat.setToName(toName);
//             chat.setContent(content);
//             chat.setType(Chat.TYPE.valueOf(type));
//             chat.setStatus(Chat.STATUS.SENT);
//             chat.setCreatedAt(LocalDateTime.now());

//             Chat savedChat = chatRepository.save(chat);

//             messagingTemplate.convertAndSendToUser(
//                     to,
//                     "/queue/user",
//                     Map.of(
//                     "id", savedChat.getId(),
//                     "type", savedChat.getType().toString(),
//                     "content", savedChat.getContent(),
//                     "status", savedChat.getStatus().toString(),
//                     "createdAt", savedChat.getCreatedAt().format(formatter)
//                     )
//             );
//             for (String salePrincipal : saleMap.keySet()) {
//                 messagingTemplate.convertAndSendToUser(salePrincipal, "/queue/sale", 
//                     Map.of(
//                         "id", savedChat.getId(),
//                         "clientId", clientId,
//                         "status", savedChat.getStatus(),
//                         "createdAt", savedChat.getCreatedAt().format(formatter)
//                     )
//                 );
//                 messagingTemplate.convertAndSendToUser(salePrincipal, "/queue/sale/listchat", 
//                     Map.of(
//                         "to", savedChat.getToUser(),
//                         "content", savedChat.getType().toString().equals("image")
//                             ? "Saler: Đã gửi 1 ảnh"
//                             : "Saler: " + savedChat.getContent(),
//                         "createdAt", savedChat.getCreatedAt().format(formatter)
//                     )
//                 );
//             }
//         }
//     }
// }
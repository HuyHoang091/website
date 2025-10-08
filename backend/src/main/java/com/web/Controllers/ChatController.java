package com.web.Controllers;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.ChatMessageDto;
import com.web.Dto.ChatSummary;
import com.web.Service.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // @PreAuthorize("hasRole('ADMIN') or hasRole('SALER')")
    @GetMapping("/list")
    public ResponseEntity<List<ChatSummary>> getChatList() {
        List<ChatSummary> chats = chatService.getChatList();
        if (chats != null && !chats.isEmpty()) {
            return ResponseEntity.ok(chats);
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // @PreAuthorize("hasRole('ADMIN') or hasRole('SALER')")
    @GetMapping("/{from}/{to}")
    public ResponseEntity<List<ChatMessageDto>> getChat(@PathVariable String from, @PathVariable String to) {
        List<ChatMessageDto> chats = chatService.getChat(from, to);
        if (chats != null && !chats.isEmpty()) {
            return ResponseEntity.ok(chats);
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/markAsRead")
    public ResponseEntity<?> markAsRead(@RequestBody Map<String, String> payload, Principal principal) {
        String userId = payload.get("userId");

        if (userId == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }

        // Đánh dấu tất cả tin nhắn từ user này là SEEN
        List<Long> updatedMessageIds = chatService.markMessagesAsRead(userId, principal.getName());

        // Gửi thông báo cập nhật trạng thái SEEN cho tất cả tin nhắn của user
        Map<String, Object> ackForUser = Map.of(
            "updatedMessageIds", updatedMessageIds,
            "status", "SEEN"
        );
        messagingTemplate.convertAndSendToUser(userId, "/queue/user", ackForUser);

        return ResponseEntity.ok().body(Map.of("success", true));
    }
}

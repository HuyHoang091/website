package com.game.Controllers;

import com.game.Dto.ChatMessageDto;
import com.game.Dto.ChatSummary;
import com.game.Service.ChatService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

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
}

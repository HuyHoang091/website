package com.game.Service;

import com.game.Dto.ChatMessageDto;
import com.game.Dto.ChatSummary;
import com.game.Model.Chat;
import com.game.Repository.ChatRepository;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ChatService {
    @Autowired
    private ChatRepository chatRepository;

    public List<ChatSummary> getChatList() {
        return chatRepository.findChatSummariesForSaler();
    }

    public List<ChatMessageDto> getChat(String from, String to) {
        return chatRepository.findConversation(from, to);
    }

    public List<Long> markMessagesAsRead(String userId, String salerName) {
        if (userId == null || userId.isEmpty())
            return List.of();

        try {
            // Lấy tất cả tin nhắn chưa đọc từ user này
            List<Chat> unreadMessages = chatRepository.findUnreadMessagesFromUser(userId);
            if (unreadMessages != null && !unreadMessages.isEmpty()) {
                for (Chat chat : unreadMessages) {
                    chat.setStatus(Chat.STATUS.SEEN);
                }
                chatRepository.saveAll(unreadMessages);
                return unreadMessages.stream().map(Chat::getId).collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("Error marking messages as read: " + e.getMessage());
        }
        return List.of();
    }
}

package com.game.Service;

import com.game.Dto.ChatMessageDto;
import com.game.Dto.ChatSummary;
import com.game.Model.Chat;
import com.game.Repository.ChatRepository;

import java.util.List;

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
}

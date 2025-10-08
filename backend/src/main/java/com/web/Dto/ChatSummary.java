package com.web.Dto;

import java.time.LocalDateTime;

public interface ChatSummary {
    String getUserId();
    String getName();
    String getLastMessage();
    String getTime();
    Integer getUnreadCount();
}
package com.web.Dto;

public interface ChatMessageDto {
    Long getId();
    String getContent();
    String getTime();
    String getStatus();
    String getType();
    Long getIsSender();
}
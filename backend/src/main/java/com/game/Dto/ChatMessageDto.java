package com.game.Dto;

public interface ChatMessageDto {
    Long getId();
    String getContent();
    String getTime();
    String getStatus();
    String getType();
    Long getIsSender();
}
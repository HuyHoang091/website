package com.web.Model;

import javax.persistence.*;

@Entity
@Table(name = "user_ai_settings")
public class UserAISettings {
    @Id
    private String userId;

    private boolean aiEnabled;

    public UserAISettings() {
    }

    public UserAISettings(String userId, boolean aiEnabled) {
        this.userId = userId;
        this.aiEnabled = aiEnabled;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isAiEnabled() {
        return aiEnabled;
    }

    public void setAiEnabled(boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
    }
}
package com.web.Model;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private User user;

    public AuthResponse(User user, String token) {
        this.user = user;
        this.token = token;
    }
}
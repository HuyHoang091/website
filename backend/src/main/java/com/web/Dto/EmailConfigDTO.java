package com.web.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailConfigDTO {
    private String host;
    private int port;
    private String username;
    private String password; // Nên che dấu mật khẩu thực
    private boolean smtpAuth;
    private boolean startTlsEnable;
    private boolean startTlsRequired;
}
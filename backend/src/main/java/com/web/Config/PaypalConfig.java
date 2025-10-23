package com.web.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import lombok.Data;

@Component
@RefreshScope
@ConfigurationProperties(prefix = "paypal")
@Data
public class PaypalConfig {
    private String clientId;
    private String secret;
    private String baseUrl;
}
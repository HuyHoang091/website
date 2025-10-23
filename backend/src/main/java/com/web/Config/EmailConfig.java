package com.web.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import lombok.Data;

@Component
@RefreshScope
@ConfigurationProperties(prefix = "spring.mail")
@Data
public class EmailConfig {
    private String host;
    private int port;
    private String username;
    private String password;
    private Properties properties;

    @Data
    public static class Properties {
        private Mail mail;

        @Data
        public static class Mail {
            private Smtp smtp;

            @Data
            public static class Smtp {
                private boolean auth;
                private Starttls starttls;

                @Data
                public static class Starttls {
                    private boolean enable;
                    private boolean required;
                }
            }
        }
    }
}
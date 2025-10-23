package com.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.config.EmailConfig;
import com.web.config.PaypalConfig;
import com.web.Dto.EmailConfigDTO;
import com.web.Dto.PaypalConfigDTO;
import com.web.Dto.OpenRouterConfigDTO;
import com.web.service.ConfigService;

import java.util.Set;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final EmailConfig emailConfig;
    private final PaypalConfig paypalConfig;
    private final ConfigService configService;
    private final ContextRefresher contextRefresher; // Thêm ContextRefresher

    @Autowired
    public ConfigController(EmailConfig emailConfig, PaypalConfig paypalConfig, ConfigService configService,
            ContextRefresher contextRefresher) {
        this.emailConfig = emailConfig;
        this.paypalConfig = paypalConfig;
        this.configService = configService;
        this.contextRefresher = contextRefresher; // Inject ContextRefresher
    }

    @GetMapping("/email")
    public ResponseEntity<EmailConfigDTO> getEmailConfig() {
        try {
            EmailConfigDTO dto = new EmailConfigDTO();
            dto.setHost(emailConfig.getHost());
            dto.setPort(emailConfig.getPort());
            dto.setUsername(emailConfig.getUsername());
            dto.setPassword("********"); // Che dấu mật khẩu thực

            if (emailConfig.getProperties() != null &&
                    emailConfig.getProperties().getMail() != null &&
                    emailConfig.getProperties().getMail().getSmtp() != null) {

                dto.setSmtpAuth(emailConfig.getProperties().getMail().getSmtp().isAuth());

                if (emailConfig.getProperties().getMail().getSmtp().getStarttls() != null) {
                    dto.setStartTlsEnable(emailConfig.getProperties().getMail().getSmtp().getStarttls().isEnable());
                    dto.setStartTlsRequired(emailConfig.getProperties().getMail().getSmtp().getStarttls().isRequired());
                }
            }

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/paypal")
    public ResponseEntity<PaypalConfigDTO> getPaypalConfig() {
        try {
            PaypalConfigDTO dto = new PaypalConfigDTO();
            dto.setClientId(paypalConfig.getClientId());
            dto.setSecret("********"); // Che dấu secret thực
            dto.setBaseUrl(paypalConfig.getBaseUrl());

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/email")
    public ResponseEntity<String> updateEmailConfig(@RequestBody EmailConfigDTO updatedConfig) {
        try {
            boolean isConnected = configService.testEmailConnection(updatedConfig);
            if (!isConnected) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Không thể kết nối đến máy chủ email với cấu hình mới. Vui lòng kiểm tra cấu hình.");
            }

            // Cập nhật cấu hình email
            EmailConfig config = new EmailConfig();
            config.setHost(updatedConfig.getHost());
            config.setPort(updatedConfig.getPort());
            config.setUsername(updatedConfig.getUsername());

            if (updatedConfig.getPassword() != null && !updatedConfig.getPassword().equals("********")) {
                config.setPassword(updatedConfig.getPassword());
            } else {
                config.setPassword(emailConfig.getPassword());
            }

            EmailConfig.Properties properties = new EmailConfig.Properties();
            EmailConfig.Properties.Mail mail = new EmailConfig.Properties.Mail();
            EmailConfig.Properties.Mail.Smtp smtp = new EmailConfig.Properties.Mail.Smtp();
            EmailConfig.Properties.Mail.Smtp.Starttls starttls = new EmailConfig.Properties.Mail.Smtp.Starttls();

            smtp.setAuth(updatedConfig.isSmtpAuth());
            starttls.setEnable(updatedConfig.isStartTlsEnable());
            starttls.setRequired(updatedConfig.isStartTlsRequired());

            smtp.setStarttls(starttls);
            mail.setSmtp(smtp);
            properties.setMail(mail);
            config.setProperties(properties);

            configService.updateEmailConfig(config);

            // Gọi /actuator/refresh để áp dụng thay đổi
            Set<String> refreshedKeys = contextRefresher.refresh();
            return ResponseEntity.ok("Email configuration updated successfully. Refreshed keys: " + refreshedKeys);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update email configuration: " + e.getMessage());
        }
    }

    @PutMapping("/paypal")
    public ResponseEntity<String> updatePaypalConfig(@RequestBody PaypalConfigDTO updatedConfig) {
        try {
            boolean isConnected = configService.testPaypalConnection(updatedConfig);
            if (!isConnected) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Không thể kết nối đến PayPal API với cấu hình mới. Vui lòng kiểm tra cấu hình.");
            }

            // Cập nhật cấu hình PayPal
            PaypalConfig config = new PaypalConfig();
            config.setClientId(updatedConfig.getClientId());

            if (updatedConfig.getSecret() != null && !updatedConfig.getSecret().equals("********")) {
                config.setSecret(updatedConfig.getSecret());
            } else {
                config.setSecret(paypalConfig.getSecret());
            }

            config.setBaseUrl(updatedConfig.getBaseUrl());

            configService.updatePaypalConfig(config);

            // Gọi /actuator/refresh để áp dụng thay đổi
            Set<String> refreshedKeys = contextRefresher.refresh();
            return ResponseEntity.ok("PayPal configuration updated successfully. Refreshed keys: " + refreshedKeys);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update PayPal configuration: " + e.getMessage());
        }
    }

    // GET facebook token
    @GetMapping("/facebook/token")
    public ResponseEntity<String> getFacebookPageAccessToken() {
        try {
            String token = configService.getFacebookPageAccessToken();
            if (token.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PUT facebook token
    @PutMapping("/facebook/token")
    public ResponseEntity<String> updateFacebookPageAccessToken(@RequestBody String newToken) {
        try {
            configService.updateFacebookPageAccessToken(newToken);
            return ResponseEntity.ok("Facebook Page Access Token updated successfully.");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update Facebook Page Access Token: " + e.getMessage());
        }
    }

    // Thêm các endpoint mới
    @GetMapping("/openrouter")
    public ResponseEntity<OpenRouterConfigDTO> getOpenRouterConfig() {
        try {
            OpenRouterConfigDTO config = configService.getOpenRouterConfig();
            // Che dấu API key
            config.setKey("********");
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/openrouter/test")
    public ResponseEntity<String> testOpenRouterConnection(@RequestBody OpenRouterConfigDTO config) {
        try {
            boolean isConnected = configService.testOpenRouterConnection(config);
            if (isConnected) {
                return ResponseEntity.ok("Kết nối đến OpenRouter API thành công!");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Không thể kết nối đến OpenRouter API. Vui lòng kiểm tra cấu hình.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi kiểm tra kết nối: " + e.getMessage());
        }
    }

    @PutMapping("/openrouter")
    public ResponseEntity<String> updateOpenRouterConfig(@RequestBody OpenRouterConfigDTO config) {
        try {
            boolean isConnected = configService.testOpenRouterConnection(config);
            if (!isConnected) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Không thể kết nối đến OpenRouter API với cấu hình mới. Vui lòng kiểm tra cấu hình.");
            }

            configService.updateOpenRouterConfig(config);

            // Gọi /actuator/refresh để áp dụng thay đổi
            Set<String> refreshedKeys = contextRefresher.refresh();
            return ResponseEntity.ok("OpenRouter configuration updated successfully. Refreshed keys: " + refreshedKeys);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update OpenRouter configuration: " + e.getMessage());
        }
    }
}
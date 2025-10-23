package com.web.service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.*;
import java.util.Properties;

import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.net.ssl.HttpsURLConnection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import com.web.config.EmailConfig;
import com.web.config.PaypalConfig;
import com.web.Dto.EmailConfigDTO;
import com.web.Dto.PaypalConfigDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Set;

import org.springframework.core.env.MapPropertySource;
import java.util.HashMap;
import java.util.Map;

import org.springframework.core.env.ConfigurableEnvironment;

import com.web.Config.FacebookTokenValidator;
import com.web.Dto.OpenRouterConfigDTO;

@Service
public class ConfigService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigService.class);
    private final ContextRefresher contextRefresher;
    private final ConfigurableEnvironment environment;

    @Autowired
    private FacebookTokenValidator fbTokenValidator;

    @Autowired
    public ConfigService(ConfigurableEnvironment environment, ContextRefresher contextRefresher) {
        this.environment = environment;
        this.contextRefresher = contextRefresher;
    }

    public void updateEmailConfig(EmailConfig emailConfig) throws IOException {
        Map<String, Object> map = new HashMap<>();

        map.put("spring.mail.host", emailConfig.getHost());
        map.put("spring.mail.port", String.valueOf(emailConfig.getPort()));
        map.put("spring.mail.username", emailConfig.getUsername());

        if (emailConfig.getPassword() != null && !emailConfig.getPassword().isEmpty()) {
            map.put("spring.mail.password", emailConfig.getPassword());
        }

        if (emailConfig.getProperties() != null &&
                emailConfig.getProperties().getMail() != null &&
                emailConfig.getProperties().getMail().getSmtp() != null) {

            map.put("spring.mail.properties.mail.smtp.auth",
                    String.valueOf(emailConfig.getProperties().getMail().getSmtp().isAuth()));

            if (emailConfig.getProperties().getMail().getSmtp().getStarttls() != null) {
                map.put("spring.mail.properties.mail.smtp.starttls.enable",
                        String.valueOf(emailConfig.getProperties().getMail().getSmtp().getStarttls().isEnable()));
                map.put("spring.mail.properties.mail.smtp.starttls.required",
                        String.valueOf(emailConfig.getProperties().getMail().getSmtp().getStarttls().isRequired()));
            }
        }

        // Các config bổ sung
        map.put("spring.cloud.config.enabled", "false");
        map.put("spring.config.import", "optional:configserver:");
        map.put("management.endpoints.web.exposure.include", "refresh");

        // Thêm property source mới hoặc cập nhật
        updateEnvironmentProperties("dynamicEmailConfig", map);

        refreshContext();
    }

    public void updatePaypalConfig(PaypalConfig paypalConfig) throws IOException {
        Map<String, Object> map = new HashMap<>();

        map.put("paypal.client-id", paypalConfig.getClientId());

        if (paypalConfig.getSecret() != null && !paypalConfig.getSecret().isEmpty()) {
            map.put("paypal.secret", paypalConfig.getSecret());
        }

        map.put("paypal.base-url", paypalConfig.getBaseUrl());

        // Các config bổ sung
        map.put("spring.cloud.config.enabled", "false");
        map.put("spring.config.import", "optional:configserver:");
        map.put("management.endpoints.web.exposure.include", "refresh");

        updateEnvironmentProperties("dynamicPaypalConfig", map);

        refreshContext();
    }

    public void updateFacebookPageAccessToken(String token) {
        // Validate token trước khi lưu
        if (!fbTokenValidator.validatePageAccessToken(token)) {
            throw new IllegalArgumentException("Invalid Facebook Page Access Token");
        }

        Map<String, Object> map = new HashMap<>();
        map.put("facebook.page-access-token", token);

        // Cập nhật property source động cho token Facebook
        updateEnvironmentProperties("dynamicFacebookConfig", map);

        refreshContext();
    }

    public String getFacebookPageAccessToken() {
        // Lấy token từ environment (trong các property source)
        String token = environment.getProperty("facebook.page-access-token");
        return token != null ? token : "";
    }

    /**
     * Kiểm tra kết nối SMTP server
     */
    public boolean testEmailConnection(EmailConfigDTO config) {
        Properties props = new Properties();
        props.put("mail.smtp.host", config.getHost());
        props.put("mail.smtp.port", config.getPort());
        props.put("mail.smtp.auth", config.isSmtpAuth());
        props.put("mail.smtp.starttls.enable", config.isStartTlsEnable());
        props.put("mail.smtp.starttls.required", config.isStartTlsRequired());

        // Tạo session với thông tin xác thực
        Session session = Session.getInstance(props, new javax.mail.Authenticator() {
            protected javax.mail.PasswordAuthentication getPasswordAuthentication() {
                // Nếu password là placeholder, sử dụng password từ cấu hình hiện tại
                String password = config.getPassword();
                if (password == null || password.equals("********")) {
                    String currentPassword = environment.getProperty("spring.mail.password");
                    if (currentPassword != null) {
                        password = currentPassword;
                    }
                }
                return new javax.mail.PasswordAuthentication(config.getUsername(), password);
            }
        });

        try {
            // Thử kết nối đến máy chủ SMTP
            Transport transport = session.getTransport("smtp");
            transport.connect();
            transport.close();
            logger.info("Email connection test successful");
            return true;
        } catch (MessagingException e) {
            logger.error("Email connection test failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra kết nối PayPal API
     */
    public boolean testPaypalConnection(PaypalConfigDTO config) {
        try {
            // Chọn secret phù hợp để sử dụng
            String secret = config.getSecret();
            if (secret == null || secret.equals("********")) {
                String currentSecret = environment.getProperty("paypal.secret");
                if (currentSecret != null) {
                    secret = currentSecret;
                }
            }

            String clientId = config.getClientId();
            String baseUrl = config.getBaseUrl();

            // Kiểm tra xem các thông tin cần thiết có đầy đủ hay không
            if (clientId == null || clientId.isEmpty() || secret == null || secret.isEmpty() || baseUrl == null
                    || baseUrl.isEmpty()) {
                logger.error("Missing required PayPal configuration");
                return false;
            }

            // Thử gọi API oauth2/token của PayPal để xác thực thông tin
            String authUrl = baseUrl + "/v1/oauth2/token";
            URL url = new URL(authUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");

            // Thiết lập Basic Authentication
            String auth = clientId + ":" + secret;
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes());
            connection.setRequestProperty("Authorization", "Basic " + encodedAuth);
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            connection.setDoOutput(true);

            // Thêm parameter cho request
            String postData = "grant_type=client_credentials";
            try (OutputStream os = connection.getOutputStream()) {
                os.write(postData.getBytes());
            }

            // Kiểm tra kết quả
            int responseCode = connection.getResponseCode();
            logger.info("PayPal connection test result: {}", responseCode);
            return (responseCode == 200);
        } catch (Exception e) {
            logger.error("PayPal connection test failed: {}", e.getMessage());
            return false;
        }
    }

    public OpenRouterConfigDTO getOpenRouterConfig() {
        OpenRouterConfigDTO config = new OpenRouterConfigDTO();
        config.setUrl(environment.getProperty("openrouter.url", "https://openrouter.ai/api/v1"));
        config.setKey(environment.getProperty("openrouter.key", ""));
        config.setModel(environment.getProperty("openrouter.model", "gpt-3.5-turbo"));
        return config;
    }

    public void updateOpenRouterConfig(OpenRouterConfigDTO config) {
        Map<String, Object> map = new HashMap<>();

        map.put("openrouter.url", config.getUrl());

        // Xử lý API key (không cập nhật nếu là placeholder)
        if (config.getKey() != null && !config.getKey().equals("********")) {
            map.put("openrouter.key", config.getKey());
        }

        map.put("openrouter.model", config.getModel());

        // Cập nhật environment
        updateEnvironmentProperties("dynamicOpenRouterConfig", map);

        refreshContext();
    }

    public boolean testOpenRouterConnection(OpenRouterConfigDTO config) {
        try {
            // Lấy API key (sử dụng key hiện tại nếu không được cung cấp)
            String apiKey = config.getKey();
            if (apiKey == null || apiKey.equals("********")) {
                apiKey = environment.getProperty("openrouter.key");
            }

            // Kiểm tra các trường bắt buộc
            if (config.getUrl() == null || config.getUrl().isEmpty() ||
                    apiKey == null || apiKey.isEmpty() ||
                    config.getModel() == null || config.getModel().isEmpty()) {
                logger.error("Missing required OpenRouter configuration");
                return false;
            }

            // Kiểm tra kết nối đến OpenRouter API
            URL url = new URL(config.getUrl() + "/models");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Authorization", "Bearer " + apiKey);
            connection.setRequestProperty("Content-Type", "application/json");

            int responseCode = connection.getResponseCode();
            logger.info("OpenRouter connection test result: {}", responseCode);
            return (responseCode == 200);
        } catch (Exception e) {
            logger.error("OpenRouter connection test failed: {}", e.getMessage());
            return false;
        }
    }

    private void refreshContext() {
        try {
            Set<String> refreshedKeys = contextRefresher.refresh();
            System.out.printf("Configuration context refreshed successfully: %s%n", refreshedKeys);
        } catch (Exception e) {
            System.err.printf("Failed to refresh context: %s%n", e.getMessage());
        }
    }

    private void updateEnvironmentProperties(String propertySourceName, Map<String, Object> map) {
        // Nếu đã có property source động, remove để cập nhật lại
        if (environment.getPropertySources().contains(propertySourceName)) {
            environment.getPropertySources().remove(propertySourceName);
        }

        // Thêm property source mới ở đầu (ưu tiên cao nhất)
        MapPropertySource newPropSource = new MapPropertySource(propertySourceName, map);
        environment.getPropertySources().addFirst(newPropSource);
    }
}
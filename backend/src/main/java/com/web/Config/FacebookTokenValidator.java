package com.web.Config;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FacebookTokenValidator {

    private static final Logger logger = LoggerFactory.getLogger(FacebookTokenValidator.class);
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean validatePageAccessToken(String token) {
        String url = "https://graph.facebook.com/me?access_token=" + token;
        try {
            String response = restTemplate.getForObject(url, String.class);
            logger.info("Facebook token is valid, response: {}", response);
            return true;
        } catch (HttpClientErrorException e) {
            logger.error("Invalid Facebook token: {}", e.getStatusCode());
            return false;
        } catch (Exception e) {
            logger.error("Error validating Facebook token", e);
            return false;
        }
    }
}

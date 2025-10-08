package com.web.Config;

import java.security.Principal;
import java.util.Map;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue"); // topic (broadcast), queue (private)
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user"); // dùng cho convertAndSendToUser
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            ServerHttpRequest request,
                            WebSocketHandler wsHandler,
                            Map<String, Object> attributes) {
                        String query = request.getURI().getQuery();
                        String tokenValue = null;

                        if (query != null) {
                            if (query.startsWith("userId=")) {
                                tokenValue = query.substring("userId=".length());
                            } else if (query.startsWith("guest=")) {
                                tokenValue = query.substring("guest=".length());
                            }
                        }
                        
                        if (tokenValue == null) {
                            tokenValue = "guest-unknown";
                        }
                        final String token = tokenValue;
                        return () -> token;
                    }
                })
                .withSockJS();
    }
}
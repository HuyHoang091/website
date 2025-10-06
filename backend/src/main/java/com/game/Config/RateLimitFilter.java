package com.game.Config;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.bucket4j.*;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> allowedOrigins = Arrays.asList(
        "http://localhost:3000",
        "http://192.168.1.7:3000"
    );

    private static class LoginRequest {
        public String username;
        public String password;
    }

    private Bucket createNewBucket() {
        return Bucket4j.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
    }

    private Bucket resolveBucket(String username) {
        return buckets.computeIfAbsent(username.toLowerCase(), k -> createNewBucket());
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        res.setCharacterEncoding("UTF-8");
        res.setContentType("text/plain; charset=UTF-8");

        String origin = req.getHeader("Origin");

        if (req.getRequestURI().equals("/api/auth/login") && req.getMethod().equalsIgnoreCase("POST")) {
            BufferedRequestWrapper bufferedRequest = new BufferedRequestWrapper(req);
            LoginRequest loginRequest = objectMapper.readValue(bufferedRequest.getReader(), LoginRequest.class);

            if (loginRequest.username == null || loginRequest.username.isBlank()) {
                res.setStatus(400);
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.getWriter().write("Vui lòng điền tên người dùng!");
                return;
            }

            if (loginRequest.password == null || loginRequest.password.isBlank()) {
                res.setStatus(400);
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.getWriter().write("Vui lòng điền mật khẩu!");
                return;
            }

            Bucket bucket = resolveBucket(loginRequest.username);

            if (bucket.tryConsume(1)) {
                chain.doFilter(bufferedRequest, response);
            } else {
                res.setStatus(429);
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.getWriter().write("Quá nhiều lần đăng nhập user: '" + loginRequest.username + "'. Vui lòng thử lại sau ít phút.");
                logger.warn("User [{}] nhập sai mật khẩu quá 5 lần", loginRequest.username);
            }

        } else {
            chain.doFilter(request, response);
        }
    }
}

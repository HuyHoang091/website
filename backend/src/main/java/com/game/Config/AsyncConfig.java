package com.game.Config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "appTaskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(50);     // Số luồng khởi tạo sẵn
        executor.setMaxPoolSize(200);     // Số luồng tối đa
        executor.setQueueCapacity(500);   // Hàng đợi nếu quá tải
        executor.setThreadNamePrefix("AsyncAppCode-");
        executor.initialize();
        return executor;
    }
}

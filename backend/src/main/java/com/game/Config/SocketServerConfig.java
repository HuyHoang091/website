// package com.game.Config;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.context.annotation.Bean;

// import com.corundumstudio.socketio.Configuration;
// import com.corundumstudio.socketio.SocketIOServer;
// import com.game.Service.AppCodeService;

// @org.springframework.context.annotation.Configuration
// public class SocketServerConfig {
//     private static final Logger logger = LoggerFactory.getLogger(SocketServerConfig.class);

//     @Autowired
//     private AppCodeService appCodeService;

//     @Bean
//     public SocketIOServer socketIOServer() {
//         Configuration config = new Configuration();
//         config.setHostname("localhost");
//         config.setPort(9092);

//         config.setExceptionListener(new SilentExceptionListener());
        
//         return new SocketIOServer(config);
//     }

//     @Bean
//     public CommandLineRunner runner(SocketIOServer server) {
//         return args -> {
//             server.addEventListener("send_hash", String.class, (client, data, ackSender) -> {
//                 System.out.println("Received hash: " + data);
//                 String sessionCode = appCodeService.verifyAppHash(data);
//                 String ipAddress = client.getRemoteAddress().toString();

//                 if (sessionCode != null) {
//                     logger.info("Ứng dụng hợp lệ từ IP: [{}]", ipAddress);
//                     client.sendEvent("verify_result", "OK|" + sessionCode);
//                 } else {
//                     logger.warn("Ứng dụng không hợp lệ từ IP: [{}]", ipAddress);
//                     client.sendEvent("verify_result", "FAILED|Ứng dụng không hợp lệ, vui lòng tải đúng phiên bản.");
//                 }
//             });

//             server.addEventListener("ping_custom", Object.class, (client, data, ackRequest) -> {
//                 client.sendEvent("pong_result", String.valueOf(System.currentTimeMillis()));
//             });

//             server.start();
//         };
//     }
// }
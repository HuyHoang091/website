package com.web.Controllers;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.aspectj.weaver.ast.Or;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.ChatMessageDto;
import com.web.Dto.ChatSummary;
import com.web.Repository.ChatRepository;
import com.web.Repository.OrderRepository;
import com.web.Service.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private OrderRepository orderRepository;

    // @PreAuthorize("hasRole('ADMIN') or hasRole('SALER')")
    @GetMapping("/list")
    public ResponseEntity<List<ChatSummary>> getChatList() {
        List<ChatSummary> chats = chatService.getChatList();
        if (chats != null && !chats.isEmpty()) {
            return ResponseEntity.ok(chats);
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // @PreAuthorize("hasRole('ADMIN') or hasRole('SALER')")
    @GetMapping("/{from}/{to}")
    public ResponseEntity<List<ChatMessageDto>> getChat(@PathVariable String from, @PathVariable String to) {
        List<ChatMessageDto> chats = chatService.getChat(from, to);
        if (chats != null && !chats.isEmpty()) {
            return ResponseEntity.ok(chats);
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/markAsRead")
    public ResponseEntity<?> markAsRead(@RequestBody Map<String, String> payload, Principal principal) {
        String userId = payload.get("userId");

        if (userId == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }

        // Đánh dấu tất cả tin nhắn từ user này là SEEN
        List<Long> updatedMessageIds = chatService.markMessagesAsRead(userId, principal.getName());

        // Gửi thông báo cập nhật trạng thái SEEN cho tất cả tin nhắn của user
        Map<String, Object> ackForUser = Map.of(
            "updatedMessageIds", updatedMessageIds,
            "status", "SEEN"
        );
        messagingTemplate.convertAndSendToUser(userId, "/queue/user", ackForUser);

        return ResponseEntity.ok().body(Map.of("success", true));
    }

    @GetMapping("/test")
    public ResponseEntity<List<Map<String, Object>>> getTest(Principal principal) {
        List<Map<String, Object>> customerGrowth = chatRepository.findCustomerGrowth();
        return ResponseEntity.ok(customerGrowth);
    }

    @GetMapping("/test1")
    public ResponseEntity<List<Map<String, Object>>> getTest1(Principal principal) {
        List<Map<String, Object>> MonthlyRevenue = orderRepository.findMonthlyStatsWithGrowthAndAverage();
        return ResponseEntity.ok(MonthlyRevenue);
    }

    @GetMapping("/test2")
    public ResponseEntity<List<Map<String, Object>>> getTest2(Principal principal) {
        List<Map<String, Object>> revenueLast7Days = orderRepository.findRevenueLast7Days();
        return ResponseEntity.ok(revenueLast7Days);
    }

    @GetMapping("/test3")
    public ResponseEntity<List<Map<String, Object>>> getTest3(Principal principal) {
        List<Map<String, Object>> revenueByCategory = orderRepository.findRevenueByCategoryExcludingParentCategories();
        return ResponseEntity.ok(revenueByCategory);
    }

    @GetMapping("/test4")
    public ResponseEntity<List<Map<String, Object>>> getTest4(Principal principal) {
        List<Map<String, Object>> top6BestSellingProducts = orderRepository.findTop6BestSellingProducts();
        return ResponseEntity.ok(top6BestSellingProducts);
    }

    @GetMapping("/test5")
    public ResponseEntity<List<Map<String, Object>>> getTest5(Principal principal) {
        List<Map<String, Object>> monthlyRevenueAndOrderCount = orderRepository.findMonthlyRevenueAndOrderCountForCurrentYear();
        return ResponseEntity.ok(monthlyRevenueAndOrderCount);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData(Principal principal) {
        // Lấy dữ liệu từ các repository
        List<Map<String, Object>> customerGrowth = chatRepository.findCustomerGrowth();
        List<Map<String, Object>> monthlyRevenue = orderRepository.findMonthlyStatsWithGrowthAndAverage();
        List<Map<String, Object>> revenueLast7Days = orderRepository.findRevenueLast7Days();
        List<Map<String, Object>> revenueByCategory = orderRepository.findRevenueByCategoryExcludingParentCategories();
        List<Map<String, Object>> top6BestSellingProducts = orderRepository.findTop6BestSellingProducts();
        List<Map<String, Object>> monthlyRevenueAndOrderCount = orderRepository.findMonthlyRevenueAndOrderCountForCurrentYear();

        // Gom dữ liệu vào một Map
        Map<String, Object> dashboardData = Map.of(
            "customerGrowth", customerGrowth,
            "monthlyRevenue", monthlyRevenue,
            "revenueLast7Days", revenueLast7Days,
            "revenueByCategory", revenueByCategory,
            "top6BestSellingProducts", top6BestSellingProducts,
            "monthlyRevenueAndOrderCount", monthlyRevenueAndOrderCount
        );

        return ResponseEntity.ok(dashboardData);
    }
}

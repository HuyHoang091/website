package com.web.Controllers;

import com.web.Service.RefundQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    @Autowired
    private RefundQueueService refundQueueService;

    @GetMapping("/failed")
    public ResponseEntity<List<Map<String, Object>>> getFailedRefunds() {
        return ResponseEntity.ok(refundQueueService.getFailedRefunds());
    }

    @GetMapping("/success")
    public ResponseEntity<List<Map<String, Object>>> getSuccessRefunds() {
        return ResponseEntity.ok(refundQueueService.getSuccessRefunds());
    }

    @PostMapping("/retry/{orderId}")
    public ResponseEntity<Map<String, String>> retryFailedRefund(@PathVariable Long orderId) {
        refundQueueService.retryFailedRefund(orderId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Refund request has been requeued");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{type}/{orderId}")
    public ResponseEntity<Map<String, String>> deleteRefund(
            @PathVariable String type,
            @PathVariable Long orderId) {
        refundQueueService.deleteRefund(type, orderId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Refund record has been deleted");
        return ResponseEntity.ok(response);
    }
}
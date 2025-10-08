package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.UserAISettings;
import com.web.Repository.UserAISettingsRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/user-ai")
@CrossOrigin
public class UserAISettingsController {

    @Autowired
    private UserAISettingsRepository userAISettingsRepository;

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUserAISettings(
            @PathVariable String userId,
            @RequestParam boolean aiEnabled) {

        UserAISettings settings = userAISettingsRepository.findById(userId)
                .orElse(new UserAISettings(userId, false));

        settings.setAiEnabled(aiEnabled);
        userAISettingsRepository.save(settings);

        return ResponseEntity.ok().body(Map.of("userId", userId, "aiEnabled", aiEnabled));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserAISettings(@PathVariable String userId) {
        UserAISettings settings = userAISettingsRepository.findById(userId)
                .orElse(new UserAISettings(userId, false));

        return ResponseEntity.ok().body(Map.of("userId", userId, "aiEnabled", settings.isAiEnabled()));
    }
}
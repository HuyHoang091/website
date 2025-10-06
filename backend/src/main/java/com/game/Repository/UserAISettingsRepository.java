package com.game.Repository;

import com.game.Model.UserAISettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAISettingsRepository extends JpaRepository<UserAISettings, String> {
}
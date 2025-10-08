package com.web.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.Model.UserAISettings;

@Repository
public interface UserAISettingsRepository extends JpaRepository<UserAISettings, String> {
}
package com.game.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.ResetToken;

public interface ResetTokenRepository extends JpaRepository<ResetToken, Long> {
    ResetToken findByToken(String token);
}

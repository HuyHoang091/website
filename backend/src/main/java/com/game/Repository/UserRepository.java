package com.game.Repository;

import com.game.Model.User;

import java.util.Optional;

import javax.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByPhone(String phone);
    User findByEmail(String email);

    @Transactional
    @Query(value = "SELECT * FROM users " +
                   "WHERE email = :email", nativeQuery = true)
    Optional<User> findByEmailOptional(@Param("email") String email);
}
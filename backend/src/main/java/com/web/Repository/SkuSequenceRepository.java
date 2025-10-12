package com.web.Repository;

import java.util.Optional;

import javax.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Model.SkuSequence;

public interface SkuSequenceRepository extends JpaRepository<SkuSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SkuSequence s WHERE s.categoryPrefix = :prefix")
    Optional<SkuSequence> findByPrefixForUpdate(@Param("prefix") String prefix);
}
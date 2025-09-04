package com.game.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Categori;

public interface CategoriRepository extends JpaRepository<Categori, Long> {
    
}

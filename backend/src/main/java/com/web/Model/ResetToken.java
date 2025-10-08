package com.web.Model;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "reset_tokens")
public class ResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    @Column(unique = true, nullable = false)
    private String token;

    private boolean used;
}

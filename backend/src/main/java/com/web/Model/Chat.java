package com.web.Model;

import lombok.Data;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "chat")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fromUser;
    private String fromName;
    private String toUser;
    private String toName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TYPE type;

    private String content;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private STATUS status;
    private LocalDateTime createdAt;

    public enum STATUS {
        SENDING,
        SENT,
        RECEIVED,
        SEEN
    }
    public enum TYPE {
        message, image
    }
}
package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.game.Dto.ChatMessageDto;
import com.game.Dto.ChatSummary;
import com.game.Model.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    @Query(value = """
            SELECT userId, name, lastMessage, time, createdAt, unreadCount
            FROM (
                SELECT
                    CASE
                        WHEN c1.from_user = 'saler' THEN c1.to_user
                        ELSE c1.from_user
                    END AS userId,
                    CASE
                        WHEN c1.from_user = 'saler' THEN c1.to_name
                        ELSE c1.from_name
                    END AS name,
                    CASE
                        WHEN c1.type = 'image' AND c1.from_user = 'saler'
                            THEN 'Saler: Đã gửi 1 ảnh'
                        WHEN c1.type = 'image' AND c1.from_user <> 'saler'
                            THEN 'Khách: Đã gửi 1 ảnh'
                        WHEN c1.from_user = 'saler'
                            THEN CONCAT('Saler: ', c1.content)
                        ELSE CONCAT('Khách: ', c1.content)
                    END AS lastMessage,
                    DATE_FORMAT(c1.created_at, '%H:%i') AS time,
                    c1.created_at AS createdAt,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                            CASE WHEN c1.from_user = 'saler' THEN c1.to_user ELSE c1.from_user END
                        ORDER BY c1.created_at DESC, c1.id DESC
                    ) AS rn,
                    (
                        SELECT COUNT(*)
                        FROM chat c2
                        WHERE c2.from_user =
                            CASE
                                WHEN c1.from_user = 'saler' THEN c1.to_user
                                ELSE c1.from_user
                            END
                        AND c2.to_user = 'saler'
                        AND c2.status = 'SENT'
                    ) AS unreadCount
                FROM chat c1
                WHERE c1.from_user = 'saler' OR c1.to_user = 'saler'
            ) t
            WHERE rn = 1
            ORDER BY createdAt DESC;
            """, nativeQuery = true)
    List<ChatSummary> findChatSummariesForSaler();

    @Query(value = """
            SELECT c.id,
                   c.content,
                   DATE_FORMAT(c.created_at, '%H:%i') AS time,
                   c.status,
                   c.type,
                   CASE WHEN c.from_user = :currentUser THEN TRUE ELSE FALSE END AS isSender
            FROM chat c
            WHERE (c.`from_user` = :currentUser AND c.`to_user` = :otherUser)
               OR (c.`from_user` = :otherUser AND c.`to_user` = :currentUser)
               AND c.content IS NOT NULL
               AND c.content <> ''
            ORDER BY c.created_at ASC
            """, nativeQuery = true)
    List<ChatMessageDto> findConversation(@Param("currentUser") String currentUser,
            @Param("otherUser") String otherUser);

    @Query("SELECT c FROM Chat c WHERE c.fromUser = :userId AND c.toUser = 'saler' AND c.status = 'SENT'")
    List<Chat> findUnreadMessagesFromUser(@Param("userId") String userId);
}
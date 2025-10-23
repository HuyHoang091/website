package com.web.Repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Dto.ChatMessageDto;
import com.web.Dto.ChatSummary;
import com.web.Model.Chat;

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

    @Query(value = """
        WITH MonthlyCustomerCount AS (
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(DISTINCT 
                    CASE 
                        WHEN from_user = 'saler' THEN to_user 
                        ELSE from_user 
                    END
                ) AS customerCount
            FROM chat
            WHERE from_user = 'saler' OR to_user = 'saler'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ),
        GrowthCalculation AS (
            SELECT
                month,
                customerCount,
                LAG(customerCount) OVER (ORDER BY month) AS previousMonthCount,
                CASE 
                    WHEN LAG(customerCount) OVER (ORDER BY month) IS NULL THEN 0
                    ELSE ROUND(((customerCount - LAG(customerCount) OVER (ORDER BY month)) * 100.0) / LAG(customerCount) OVER (ORDER BY month), 2)
                END AS growthPercentage
            FROM MonthlyCustomerCount
        )
        SELECT * FROM GrowthCalculation
        ORDER BY month DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findCustomerGrowth();

    @Query(value = """
        WITH DailyCustomerStats AS (
            SELECT
                DATE(created_at) AS date,
                COUNT(DISTINCT 
                    CASE 
                        WHEN from_user = 'saler' THEN to_user 
                        ELSE from_user 
                    END
                ) AS totalCustomers,
                COUNT(DISTINCT 
                    CASE 
                        WHEN from_user = 'saler' AND DATE(created_at) = DATE(first_interaction) THEN to_user
                        WHEN to_user = 'saler' AND DATE(created_at) = DATE(first_interaction) THEN from_user
                        ELSE NULL
                    END
                ) AS newCustomers
            FROM chat
            LEFT JOIN (
                SELECT 
                    CASE 
                        WHEN from_user = 'saler' THEN to_user 
                        ELSE from_user 
                    END AS userId,
                    MIN(created_at) AS first_interaction
                FROM chat
                WHERE from_user = 'saler' OR to_user = 'saler'
                GROUP BY userId
            ) AS FirstInteraction ON 
                (chat.from_user = FirstInteraction.userId OR chat.to_user = FirstInteraction.userId)
            WHERE from_user = 'saler' OR to_user = 'saler'
            GROUP BY DATE(created_at)
        ),
        GrowthCalculation AS (
            SELECT
                date,
                totalCustomers,
                newCustomers,
                LAG(totalCustomers) OVER (ORDER BY date) AS previousDayCustomers,
                CASE 
                    WHEN LAG(totalCustomers) OVER (ORDER BY date) IS NULL THEN 0
                    ELSE ROUND(((totalCustomers - LAG(totalCustomers) OVER (ORDER BY date)) * 100.0) / LAG(totalCustomers) OVER (ORDER BY date), 2)
                END AS growthPercentage
            FROM DailyCustomerStats
        )
        SELECT * FROM GrowthCalculation
        ORDER BY date DESC;
        """, nativeQuery = true)
    List<Map<String, Object>> findDailyCustomerStats();
}
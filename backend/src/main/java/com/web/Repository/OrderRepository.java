package com.web.Repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Model.Order;
import com.web.Dto.OrderDetailDto;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_Id(Long userId);

    @Query(value = """
        SELECT o
        FROM Order o
        JOIN o.address a
        WHERE a.customerId = :fbId
    """)
    List<Order> findByCustomerFB(Long fbId);

    @Query("SELECT new com.web.Dto.OrderDetailDto(o.id, o.user.id, o.address.id, o.address.fullName, o.address.phone, o.address.detail, o.orderNumber, CASE \r\n" + //
                "    WHEN o.address.user.id IS NULL THEN 'Facebook'\r\n" + //
                "    ELSE 'Web'\r\n" + //
                "  END AS source, o.status, o.totalAmount, o.createBy, o.note, o.createdAt) FROM Order o")
    List<OrderDetailDto> findAllOrderDetails();

    @Query("SELECT new com.web.Dto.OrderDetailDto(o.id, o.user.id, o.address.id, o.address.fullName, o.address.phone, o.address.detail, o.orderNumber, CASE \r\n" + //
                "    WHEN o.address.user.id IS NULL THEN 'Facebook'\r\n" + //
                "    ELSE 'Web'\r\n" + //
                "  END AS source, o.status, o.totalAmount, o.createBy, o.note, o.createdAt) FROM Order o WHERE o.id = :id")
    List<OrderDetailDto> findOrderDetailsById(@Param("id") Long id);

    @Query(value = """
        WITH MonthlyStats AS (
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month, -- Lấy tháng từ created_at
                COUNT(*) AS orderCount, -- Tổng số lượng đơn hàng
                SUM(total_amount) AS revenue, -- Tổng doanh thu
                AVG(total_amount) AS averageOrderValue -- Giá trị trung bình của đơn hàng
            FROM orders
            WHERE status NOT IN ('returned', 'cancelled') -- Loại bỏ các đơn hàng có trạng thái returned và cancelled
            GROUP BY DATE_FORMAT(created_at, '%Y-%m') -- Nhóm theo tháng
        ),
        GrowthCalculation AS (
            SELECT
                month,
                orderCount,
                revenue,
                averageOrderValue,
                LAG(orderCount) OVER (ORDER BY month) AS previousMonthOrderCount, -- Số lượng đơn hàng tháng trước
                LAG(revenue) OVER (ORDER BY month) AS previousMonthRevenue, -- Doanh thu tháng trước
                LAG(averageOrderValue) OVER (ORDER BY month) AS previousMonthAverage, -- Giá trị trung bình tháng trước
                CASE 
                    WHEN LAG(orderCount) OVER (ORDER BY month) IS NULL THEN 0
                    ELSE ROUND(((orderCount - LAG(orderCount) OVER (ORDER BY month)) * 100.0) / LAG(orderCount) OVER (ORDER BY month), 2)
                END AS orderGrowthPercentage, -- Tỷ lệ tăng trưởng số lượng đơn hàng
                CASE 
                    WHEN LAG(revenue) OVER (ORDER BY month) IS NULL THEN 0
                    ELSE ROUND(((revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0) / LAG(revenue) OVER (ORDER BY month), 2)
                END AS revenueGrowthPercentage, -- Tỷ lệ tăng trưởng doanh thu
                CASE 
                    WHEN LAG(averageOrderValue) OVER (ORDER BY month) IS NULL THEN 0
                    ELSE ROUND(((averageOrderValue - LAG(averageOrderValue) OVER (ORDER BY month)) * 100.0) / LAG(averageOrderValue) OVER (ORDER BY month), 2)
                END AS averageGrowthPercentage -- Tỷ lệ tăng trưởng giá trị trung bình
            FROM MonthlyStats
        )
        SELECT * FROM GrowthCalculation
        ORDER BY month DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findMonthlyStatsWithGrowthAndAverage();

    @Query(value = """
        SELECT
            DATE(created_at) AS date,
            SUM(total_amount) AS revenue
        FROM orders
        WHERE status NOT IN ('returned', 'cancelled')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findRevenueLast7Days();

    @Query(value = """
        SELECT
            c.name AS categoryName,
            SUM(oi.line_total) AS revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN categories c ON p.categories_id = c.id
        WHERE o.status NOT IN ('returned', 'cancelled')
        AND c.parent_id IS NOT NULL
        GROUP BY c.name
        ORDER BY revenue DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findRevenueByCategoryExcludingParentCategories();

    @Query(value = """
        SELECT
            p.name AS productName,
            SUM(oi.quantity) AS totalSold
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status NOT IN ('returned', 'cancelled')
        GROUP BY p.id, p.name
        ORDER BY totalSold DESC
        LIMIT 6
        """, nativeQuery = true)
    List<Map<String, Object>> findTop6BestSellingProducts();

    @Query(value = """
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            COUNT(*) AS orderCount,
            SUM(total_amount) AS revenue
        FROM orders
        WHERE status NOT IN ('returned', 'cancelled')
        AND YEAR(created_at) = YEAR(CURDATE())
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
        """, nativeQuery = true)
    List<Map<String, Object>> findMonthlyRevenueAndOrderCountForCurrentYear();

    @Query(value = """
        SELECT
            DATE(o.created_at) AS date,
            COUNT(CASE WHEN o.status NOT IN ('returned', 'cancelled') THEN 1 END) AS confirmedOrders,
            COUNT(CASE WHEN o.status IN ('returned', 'cancelled') THEN 1 END) AS returnedOrders,
            SUM(CASE WHEN o.status NOT IN ('returned', 'cancelled') THEN o.total_amount ELSE 0 END) AS revenue
        FROM orders o
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findOrderStatsByDate();
}

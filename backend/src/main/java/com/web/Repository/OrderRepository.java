package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Model.Order;
import com.web.Dto.OrderDetailDto;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_Id(Long userId);

    @Query("SELECT new com.web.Dto.OrderDetailDto(o.id, o.address.fullName, CONCAT(o.address.detail, ', ', o.address.ward, ', ', o.address.district, ', ', o.address.city), o.orderNumber, CASE \r\n" + //
                "    WHEN o.address.user.id IS NULL THEN 'Facebook'\r\n" + //
                "    ELSE 'Web'\r\n" + //
                "  END AS source, o.status, o.totalAmount, o.createBy) FROM Order o")
    List<OrderDetailDto> findAllOrderDetails();

    @Query("SELECT new com.web.Dto.OrderDetailDto(o.id, o.address.fullName, CONCAT(o.address.detail, ', ', o.address.ward, ', ', o.address.district, ', ', o.address.city), o.orderNumber, CASE \r\n" + //
                "    WHEN o.address.user.id IS NULL THEN 'Facebook'\r\n" + //
                "    ELSE 'Web'\r\n" + //
                "  END AS source, o.status, o.totalAmount, o.createBy) FROM Order o WHERE o.id = :id")
    List<OrderDetailDto> findOrderDetailsById(@Param("id") Long id);
}

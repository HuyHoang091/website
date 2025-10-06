package com.game.Model;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "customer")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String psid; // Facebook PSID
    private String name; // Tên khách hàng
    private String source; // "facebook" hoặc "website"
}
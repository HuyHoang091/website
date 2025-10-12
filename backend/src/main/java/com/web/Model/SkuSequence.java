package com.web.Model;

import javax.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "sku_sequences")
public class SkuSequence {

    @Id
    @Column(name = "category_prefix", length = 1)
    private String categoryPrefix; // ký tự đầu của category

    @Column(name = "current_number", nullable = false)
    private Long currentNumber = 0L;
}
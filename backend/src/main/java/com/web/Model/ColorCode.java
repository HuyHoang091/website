package com.web.Model;

import javax.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "color_codes")
public class ColorCode {

    @Id
    @Column(name = "color_name", length = 50)
    private String colorName;

    @Column(name = "color_hex", length = 7)
    private String colorHex;
}

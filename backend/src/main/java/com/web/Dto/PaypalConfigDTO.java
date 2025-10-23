package com.web.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaypalConfigDTO {
    private String clientId;
    private String secret; // Nên che dấu secret thực
    private String baseUrl;
}
package com.game.Dto;

import lombok.Data;

import java.util.List;

@Data
public class VariantResponse {
    private List<String> sizes;
    private List<ColorDto> colors;
}
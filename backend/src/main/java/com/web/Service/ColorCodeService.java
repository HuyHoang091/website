package com.web.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.Model.ColorCode;
import com.web.Repository.ColorCodeRepository;

import java.util.List;

@Service
public class ColorCodeService {

    @Autowired
    private ColorCodeRepository colorCodeRepository;

    public List<ColorCode> getAllColors() {
        return colorCodeRepository.findAll();
    }

    public ColorCode createColor(ColorCode colorCode) {
        return colorCodeRepository.save(colorCode);
    }

    public ColorCode getColorByName(String colorName) {
        return colorCodeRepository.findById(colorName).orElse(null);
    }

    public ColorCode updateColor(String name, ColorCode newColorCode) {
        ColorCode oldColorCode = colorCodeRepository.findById(name).orElse(null);
        if (oldColorCode == null) return null;
        oldColorCode.setColorHex(newColorCode.getColorHex());
        return colorCodeRepository.save(oldColorCode);
    }

    public boolean deleteColor(String name) {
        if (!colorCodeRepository.existsById(name)) {
            return false;
        }
        colorCodeRepository.deleteById(name);
        return true;
    }
}
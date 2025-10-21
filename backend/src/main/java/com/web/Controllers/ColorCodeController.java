package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.ColorCode;
import com.web.Service.ColorCodeService;

import java.util.List;

@RestController
@RequestMapping("/api/colors")
public class ColorCodeController {

    @Autowired
    private ColorCodeService colorCodeService;

    @GetMapping("/")
    public List<ColorCode> getAllColors() {
        return colorCodeService.getAllColors();
    }

    @PostMapping("/")
    public ResponseEntity<?> createColor(@RequestBody ColorCode colorCode) {
        try {
            ColorCode savedColor = colorCodeService.createColor(colorCode);
            return new ResponseEntity<>(savedColor, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi thêm màu: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{colorName}")
    public ResponseEntity<?> getColorByName(@PathVariable String colorName) {
        try {
            ColorCode color = colorCodeService.getColorByName(colorName);
            if (color != null) {
                return new ResponseEntity<>(color, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy màu với tên: " + colorName, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi tìm màu: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{colorName}")
    public ResponseEntity<?> updateColor(@PathVariable String colorName, @RequestBody ColorCode colorCode) {
        try {
            ColorCode updatedColor = colorCodeService.updateColor(colorName, colorCode);
            if (updatedColor != null) {
                return new ResponseEntity<>(updatedColor, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy màu với tên: " + colorName, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi cập nhật màu: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{colorName}")
    public ResponseEntity<?> deleteColor(@PathVariable String colorName) {
        try {
            boolean deleted = colorCodeService.deleteColor(colorName);
            if (deleted) {
                return new ResponseEntity<>("Xóa màu thành công", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy màu với tên: " + colorName, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi xóa màu: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
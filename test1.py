import numpy as np

def k_nearest_mean_filter(img, W=3, k=3, T=2, include_center=True):
    """
    Lọc trung bình theo k giá trị gần nhất với ngưỡng T.

    img: ảnh xám (2D numpy array)
    W: kích thước cửa sổ (W x W)
    k: số giá trị gần nhất để tính trung bình
    T: ngưỡng so sánh
    include_center: có tính luôn I(x,y) trong k hay không
    """
    pad = W // 2
    padded = np.pad(img, ((pad, pad), (pad, pad)), mode='reflect')
    out = np.zeros_like(img, dtype=np.uint8)

    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            center_val = int(img[i, j])  # tránh lỗi uint8 wrap-around
            
            # Lấy cửa sổ lân cận
            window = padded[i:i+W, j:j+W].astype(int).flatten()
            
            # Tính khoảng cách |I(q) - I(x,y)|
            diffs = np.abs(window - center_val)

            # Nếu không tính trung tâm → loại nó ra
            if not include_center:
                center_idx = (W*W) // 2
                diffs = np.delete(diffs, center_idx)
                window = np.delete(window, center_idx)

            # Lấy k giá trị gần nhất
            nearest_vals = window[np.argsort(diffs)[:k]]
            
            # Tính trung bình AVk
            AVk = np.mean(nearest_vals)

            # Quy tắc thay thế
            if abs(center_val - AVk) > T:
                out[i, j] = int(round(AVk))
            else:
                out[i, j] = center_val
    
    return out

# ---------------- DEMO ----------------
I = np.array([
    [1, 2, 3, 2],
    [4, 16, 2, 1],
    [4, 2, 1, 1],
    [2, 1, 2, 1]
], dtype=np.uint8)

filtered = k_nearest_mean_filter(I, W=3, k=3, T=2, include_center=True)

print("Ảnh gốc:\n", I)
print("\nẢnh sau lọc k-nearest mean (k=3, T=2):\n", filtered)

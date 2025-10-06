import zipfile
import os

def extract_images_from_zip_excel(file_path, output_dir="images_from_zip"):
    os.makedirs(output_dir, exist_ok=True)
    with zipfile.ZipFile(file_path, 'r') as zip_ref:
        zip_ref.extractall("temp_excel")

    media_dir = os.path.join("temp_excel", "xl", "media")
    if os.path.exists(media_dir):
        for filename in os.listdir(media_dir):
            src = os.path.join(media_dir, filename)
            dst = os.path.join(output_dir, filename)
            if os.path.exists(dst):
                os.remove(dst)
            os.rename(src, dst)
        print(f"✅ Trích xuất ảnh từ {media_dir} thành công.")
    else:
        print("⚠️ Không tìm thấy thư mục chứa ảnh (xl/media).")


# ===============================
# 🔽 CHẠY CHƯƠNG TRÌNH
# ===============================
if __name__ == "__main__":
    excel_file = "image.xlsx"  # 👉 Thay bằng tên file Excel của bạn
    extract_images_from_zip_excel(excel_file)

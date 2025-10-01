from ultralytics import YOLO

# Khởi tạo model YOLOv8 nhỏ
model = YOLO("yolov8s-seg.pt")  # pretrained sẵn

# Huấn luyện với dataset của bạn
model.train(
    data=r"C:\xampp\htdocs\hoanghuy\project\T-shirt.v1-cropped.yolov8\data.yaml",
    epochs=50,
    imgsz=640,
    batch=8,
    device="cuda"
)

# Sau khi train xong sẽ có file best.pt trong runs/train/exp/

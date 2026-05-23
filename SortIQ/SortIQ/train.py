"""
Training YOLOv8 untuk deteksi limbah
Kelas: logam (0), organik (1)

Jalankan:
    pip install ultralytics
    python train.py
"""

from ultralytics import YOLO
from pathlib import Path

# ── Path dataset (sesuaikan dengan lokasi di laptop kamu)
# Taruh folder waste_dataset/ di folder yang sama dengan train.py
DATASET_YAML = Path(r"D:\Python VSCODE\SortIQ\waste_dataset_full\waste.yaml")
EPOCHS       = 30
IMG_SIZE     = 320
BATCH        = 4   #

# ── Training
print("=" * 50)
print("  Training YOLOv8 - Waste Detector")
print("  Kelas: logam, organik")
print("=" * 50)

model = YOLO("yolov8n.pt")  # Download otomatis kalau belum ada

results = model.train(
    data=str(DATASET_YAML),
    epochs=EPOCHS,
    imgsz=IMG_SIZE,
    batch=BATCH,
    name="waste_detector",
    patience=15,      # Stop kalau tidak ada peningkatan 15 epoch
    save=True,
    plots=True,
)

print("\n✅ Training selesai!")
print(f"   Model terbaik: runs/detect/waste_detector/weights/best.pt")
print(f"\n   Salin best.pt ke folder waste_detector.py lalu rename jadi waste_best.pt")
print(f"   Lalu jalankan lagi: python waste_detector.py")

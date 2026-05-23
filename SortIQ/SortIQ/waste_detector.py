"""
=============================================================
  WASTE DETECTOR - YOLOv8 + Webcam
  Deteksi: Logam | Tekstil | Organik
  
  Jalankan dulu:
    pip install ultralytics opencv-python flask flask-cors
  
  Lalu:
    python waste_detector.py
  
  Buka browser: http://localhost:5000
=============================================================
"""

import cv2
import json
import time
import base64
import threading
from datetime import datetime
from collections import deque, defaultdict
from flask import Flask, Response, jsonify
from flask_cors import CORS
from ultralytics import YOLO

# ─────────────────────────────────────────────
#  KONFIGURASI
# ─────────────────────────────────────────────
MODEL_PATH   = "waste_best.pt"   # Ganti ini kalau punya model custom
FALLBACK_MODEL = "yolov8n.pt"    # Fallback pakai pretrained COCO
CAMERA_INDEX = 1                  # 1 = web cam eksternal
CONFIDENCE   = 0.7               # Threshold confidence (0.0 - 1.0)
IMG_SIZE     = 320
PORT         = 5000

# Nama kelas - SESUAIKAN dengan model kamu
# Kalau pakai pretrained COCO (fallback), kelas ini diabaikan
WASTE_CLASSES = {
    0: "logam",
    1: "tekstil",
    2: "organik"
}

# Warna per kelas (BGR)
CLASS_COLORS = {
    "logam":   (255, 180,  50),   # Kuning emas
    "tekstil": (255,  90, 180),   # Pink
    "organik": ( 60, 200,  80),   # Hijau
    "default": (200, 200, 200),
}

# ─────────────────────────────────────────────
#  STATE GLOBAL (thread-safe)
# ─────────────────────────────────────────────
class DetectorState:
    def __init__(self):
        self.lock         = threading.Lock()
        self.frame_bytes  = None
        self.detections   = []
        self.fps          = 0.0
        self.is_running   = False
        self.total_counts = defaultdict(int)   # Total sejak start
        self.history      = deque(maxlen=100)  # Log deteksi terakhir

state = DetectorState()

# ─────────────────────────────────────────────
#  LOAD MODEL
# ─────────────────────────────────────────────
def load_model():
    import os
    if os.path.exists(MODEL_PATH):
        print(f"[✓] Memuat model custom: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        custom = True
    else:
        print(f"[!] Model custom '{MODEL_PATH}' tidak ditemukan.")
        print(f"[✓] Memakai model pretrained COCO: {FALLBACK_MODEL}")
        print(f"    (Kelas yang terdeteksi bukan logam/tekstil/organik)")
        model = YOLO(FALLBACK_MODEL)
        custom = False
    return model, custom

# ─────────────────────────────────────────────
#  THREAD: CAPTURE & DETECT
# ─────────────────────────────────────────────
def detection_loop():
    model, is_custom = load_model()
    cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        print(f"[ERROR] Tidak bisa buka kamera index {CAMERA_INDEX}")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print(f"[✓] Kamera terbuka. Resolusi: {int(cap.get(3))}x{int(cap.get(4))}")
    print(f"[✓] Server siap → buka http://localhost:{PORT}")

    fps_counter = deque(maxlen=30)
    state.is_running = True

    while state.is_running:
        t_start = time.time()
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue

        # ── Run YOLO inference
        results = model(frame, conf=CONFIDENCE, imgsz=IMG_SIZE, verbose=False)
        result  = results[0]

        # ── Parse deteksi
        current_detections = []
        annotated = frame.copy()

        for box in result.boxes:
            cls_id     = int(box.cls[0])
            conf_score = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Nama kelas
            if is_custom:
                label = WASTE_CLASSES.get(cls_id, f"kelas_{cls_id}")
            else:
                label = model.names[cls_id]

            color = CLASS_COLORS.get(label, CLASS_COLORS["default"])

            # Gambar bounding box
            thickness = 2
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness)

            # Label background
            txt = f"{label}  {conf_score:.0%}"
            (tw, th), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2)
            cv2.rectangle(annotated, (x1, y1 - th - 12), (x1 + tw + 10, y1), color, -1)
            cv2.putText(annotated, txt, (x1 + 5, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

            det = {
                "label": label,
                "confidence": round(conf_score, 3),
                "bbox": [x1, y1, x2, y2],
                "time": datetime.now().strftime("%H:%M:%S")
            }
            current_detections.append(det)
            state.total_counts[label] += 1
            state.history.appendleft(det)

        # ── FPS overlay
        fps_counter.append(time.time() - t_start)
        fps = 1.0 / (sum(fps_counter) / len(fps_counter))

        cv2.putText(annotated, f"FPS: {fps:.1f}", (14, 34),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 180), 2)
        cv2.putText(annotated, f"Deteksi: {len(current_detections)}", (14, 64),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 180), 2)

        # ── Encode ke JPEG
        _, buf = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 60])

        with state.lock:
            state.frame_bytes  = buf.tobytes()
            state.detections   = current_detections
            state.fps          = round(fps, 1)

    cap.release()
    print("[✓] Kamera dilepas.")

# ─────────────────────────────────────────────
#  FLASK API
# ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

def generate_stream():
    """MJPEG stream untuk <img> di browser."""
    while True:
        with state.lock:
            frame = state.frame_bytes
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.05)

@app.route('/video_feed')
def video_feed():
    return Response(generate_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def api_status():
    with state.lock:
        return jsonify({
            "fps":        state.fps,
            "detections": state.detections,
            "counts":     dict(state.total_counts),
            "history":    list(state.history)[:20]
        })

@app.route('/api/reset', methods=['POST'])
def api_reset():
    with state.lock:
        state.total_counts.clear()
        state.history.clear()
    return jsonify({"status": "ok"})

@app.route('/')
def index():
    import os
    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")
    return open(html_path, encoding="utf-8").read()

# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
if __name__ == '__main__':
    t = threading.Thread(target=detection_loop, daemon=True)
    t.start()
    time.sleep(1.5)  # Beri waktu kamera init
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)

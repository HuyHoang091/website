from fastapi import FastAPI, UploadFile, File
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import numpy as np
import faiss
from collections import defaultdict
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Fashion Image Search")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ================= CONFIG =================
MODEL_NAME = "patrickjohncyh/fashion-clip"  # model fashion trên Hugging Face
EMBED_DIM = 512

# trọng số khi trộn điểm
W_GLOBAL = 0.2
W_CLOTHES = 0.5
W_RERANK = 0.3

SEARCH_K_FACTOR = 3
# ==========================================

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading {MODEL_NAME} on {device}")
model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
processor = CLIPProcessor.from_pretrained(MODEL_NAME, use_fast=True)
model.eval()

# FAISS index
index_global = faiss.IndexFlatIP(EMBED_DIM)
index_clothes = faiss.IndexFlatIP(EMBED_DIM)

product_ids_global, product_ids_clothes = [], []
embeddings_global_store, embeddings_clothes_store = [], []

# ====== Hàm embedding ======
def get_image_embedding(image: Image.Image):
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
    return emb.cpu().numpy()

# ====== Hàm crop áo (tạm: crop trung tâm) ======
def detect_clothes(image: Image.Image) -> Image.Image:
    w, h = image.size
    left, top = int(w*0.15), int(h*0.15)
    right, bottom = int(w*0.85), int(h*0.85)
    return image.crop((left, top, right, bottom))

# ====== API thêm sản phẩm ======
@app.post("/add-product/")
async def add_product(product_id: str, file: UploadFile = File(...)):
    img_bytes = await file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    g_emb = get_image_embedding(image)[0]
    index_global.add(g_emb.reshape(1, -1))
    product_ids_global.append(product_id)
    embeddings_global_store.append(g_emb)

    c_img = detect_clothes(image)
    c_emb = get_image_embedding(c_img)[0]
    index_clothes.add(c_emb.reshape(1, -1))
    product_ids_clothes.append(product_id)
    embeddings_clothes_store.append(c_emb)

    return {"status": "added", "product_id": product_id}

# ====== API tìm kiếm ======
@app.post("/search/")
async def search(file: UploadFile = File(...), top_k: int = 5):
    img_bytes = await file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    q_global = get_image_embedding(image)[0]
    q_clothes = get_image_embedding(detect_clothes(image))[0]

    k_pull = max(top_k * SEARCH_K_FACTOR, top_k)
    candidate_scores = defaultdict(list)

    if index_global.ntotal > 0:
        k1 = min(k_pull, index_global.ntotal)
        s, idxs = index_global.search(q_global.reshape(1, -1), k1)
        for score, idx in zip(s[0], idxs[0]):
            pid = product_ids_global[idx]
            candidate_scores[pid].append(("global", float(score)))

    if index_clothes.ntotal > 0:
        k2 = min(k_pull, index_clothes.ntotal)
        s, idxs = index_clothes.search(q_clothes.reshape(1, -1), k2)
        for score, idx in zip(s[0], idxs[0]):
            pid = product_ids_clothes[idx]
            candidate_scores[pid].append(("clothes", float(score)))

    # re-rank
    final_list = []
    for pid, entries in candidate_scores.items():
        best_global = max((s for src, s in entries if src == "global"), default=0.0)
        best_clothes = max((s for src, s in entries if src == "clothes"), default=0.0)
        rerank_score = max(
            (float(np.dot(q_clothes, emb)) for emb, p in zip(embeddings_clothes_store, product_ids_clothes) if p == pid),
            default=0.0
        )
        final_score = W_GLOBAL*best_global + W_CLOTHES*best_clothes + W_RERANK*rerank_score
        final_list.append({
            "product_id": pid,
            "score": final_score
        })

    final_list = sorted(final_list, key=lambda x: x["score"], reverse=True)[:top_k]
    return {"results": final_list}

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_NAME, "device": device}

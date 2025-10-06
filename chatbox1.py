from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from qdrant_client.http.models import VectorParams, Distance
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from typing import List
import pandas as pd
import uuid
import unidecode
import re
from io import BytesIO
from vncorenlp import VnCoreNLP
from vietnamese_diacritics_restoration import restore_diacritics

app = FastAPI()

model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
model = SentenceTransformer(model_name)
kw_model = KeyBERT(model)

qdrant = QdrantClient(path="./qdrant_data")
collection_name = "faq_collection"

qdrant.recreate_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)

def has_vietnamese_tone(text: str) -> bool:
    vietnamese_chars = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ" \
                       "ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰ" \
                       "ỲÝỶỸỴĐ"
    return any(c in vietnamese_chars for c in text)

def preprocess(text: str) -> str:
    text = text.lower()

    # Nếu không có dấu thì phục hồi dấu
    if not has_vietnamese_tone(text):
        try:
            text = restore_diacritics(text)
        except Exception as e:
            print("Lỗi khi hồi dấu:", e)
            # Fallback: giữ nguyên không dấu

    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_keywords(text: str, top_n=3):
    keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 3), stop_words='english', top_n=top_n)
    return [kw for kw, _ in keywords]

@app.post("/upload_excel/")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))

    if not {"Câu hỏi", "Câu trả lời"}.issubset(df.columns):
        return {"error": "File Excel phải có cột 'Câu hỏi' và 'Câu trả lời'"}

    questions = df["Câu hỏi"].astype(str).tolist()
    answers = df["Câu trả lời"].astype(str).tolist()
    processed = [preprocess(q) for q in questions]
    embeddings = model.encode(processed)

    points = []
    for q, a, emb in zip(questions, answers, embeddings):
        keywords = extract_keywords(q)
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=emb.tolist(),
                payload={"question": q, "answer": a, "keywords": keywords}
            )
        )

    qdrant.upsert(collection_name=collection_name, points=points)
    return {"message": f"Đã lưu {len(points)} câu hỏi vào Qdrant"}

class QuestionInput(BaseModel):
    question: str

@app.post("/ask/")
def ask_question(query: QuestionInput, top_k: int = 5):
    original_question = query.question
    cleaned_question = preprocess(original_question)
    query_vector = model.encode(cleaned_question).tolist()
    query_keywords = extract_keywords(original_question)

    results = qdrant.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k
    )

    best_match = None
    highest_match_score = -1

    for r in results:
        stored_keywords = r.payload.get("keywords", [])
        match_score = len(set(query_keywords) & set(stored_keywords))
        if match_score > highest_match_score:
            highest_match_score = match_score
            best_match = r

    if best_match:
        return {
            "question": best_match.payload["question"],
            "answer": best_match.payload["answer"],
            "matched_keywords": list(set(query_keywords) & set(best_match.payload["keywords"]))
        }
    else:
        return {"message": "Không tìm thấy câu trả lời phù hợp."}

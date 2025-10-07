"""
Cross-encoder reranker component
"""
from typing import List, Optional
from haystack import Document, component
from sentence_transformers import CrossEncoder
from config import DEVICE

@component
class CrossEncoderReranker:
    """Cross-encoder reranker using sentence-transformers."""
    
    def __init__(self, model_name: str = "itdainb/PhoRanker", top_k: int = 20):
        self.model = CrossEncoder(model_name)
        try:
            # move model to device (cuda or cpu)
            self.model.to(DEVICE)
        except Exception:
            pass
        self.default_top_k = top_k

    @component.output_types(documents=List[Document])
    def run(self, query: str, documents: List[Document], top_k: Optional[int] = None):
        if not documents:
            return {"documents": []}
        k = top_k or self.default_top_k
        pairs = [(query, d.content) for d in documents]
        scores = self.model.predict(pairs)
        for d, s in zip(documents, scores):
            d.score = float(s)
        reranked = sorted(documents, key=lambda d: d.score or 0.0, reverse=True)[:k]
        return {"documents": reranked}
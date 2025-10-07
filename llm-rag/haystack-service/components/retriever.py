"""
Custom BM25 Retriever component
"""
from typing import List, Optional, Dict
from haystack import Document, component
from config import EMBEDDING_MODEL 
from transformers import AutoTokenizer
try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

@component
class BM25OkapiRetriever:
    """BM25 retriever using the rank_bm25 package."""
    
    def __init__(self, document_store, top_k: int = 20):
        self.document_store = document_store
        self.top_k = top_k
        self.bm25 = None
        self.corpus = []
        self.doc_ids = []
        self.tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL)
        self.initialize()

    def _tokenize(self, text: str):
        """Tokenize text using the embedding model's tokenizer."""
        tokens = self.tokenizer.tokenize(text.lower())
        return tokens
    
    def initialize(self):
        """Initialize or update BM25 index from document store"""
        docs = self.document_store.filter_documents({})
        if not docs:
            self.corpus = []
            self.doc_ids = []
            self.bm25 = None
            return

        # Tokenize documents for BM25
        self.corpus = [self._tokenize(doc.content) for doc in docs]
        self.doc_ids = [doc.id for doc in docs]
        self.bm25 = BM25Okapi(self.corpus)
    
    @component.output_types(documents=List[Document])
    def run(self, query: str, filters: Optional[Dict] = None, top_k: Optional[int] = None):
        """Run BM25 retrieval on the query"""
        if not self.bm25 or not self.corpus:
            self.initialize()
            if not self.bm25:
                return {"documents": []}
        
        k = top_k or self.top_k
        query_tokens = self._tokenize(query)
        scores = self.bm25.get_scores(query_tokens)
        
        # Sort by score and get top k results
        scored_docs = list(zip(self.doc_ids, scores))
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        top_ids = [doc_id for doc_id, _ in scored_docs[:k]]
        
        # Sửa: Không dùng filter_documents trực tiếp với filters từ request
        # mà lấy tất cả documents rồi lọc trong Python để tránh lỗi syntax
        try:
            # Lấy tất cả docs (có áp dụng filters hoặc không)
            if filters:
                all_docs = self.document_store.filter_documents(filters)
            else:
                all_docs = self.document_store.filter_documents({})
                
            # Lọc theo top_ids trong Python
            result_docs = [doc for doc in all_docs if doc.id in top_ids]
            
            # Sắp xếp kết quả theo điểm BM25
            id_to_score = dict(scored_docs)
            for doc in result_docs:
                doc.score = id_to_score.get(doc.id, 0.0)
                
            # Sắp xếp theo score
            result_docs = sorted(result_docs, key=lambda d: d.score or 0.0, reverse=True)
            print(f"BM25 retrieved {len(result_docs)} documents after filtering.")
            return {"documents": result_docs[:k]}
            
        except Exception as e:
            print(f"BM25 filter error: {str(e)}")
            # Fallback: lấy tất cả documents không áp dụng filter
            try:
                all_docs = self.document_store.filter_documents({})
                result_docs = [doc for doc in all_docs if doc.id in top_ids]
                
                # Đánh điểm và sắp xếp
                id_to_score = dict(scored_docs)
                for doc in result_docs:
                    doc.score = id_to_score.get(doc.id, 0.0)
                
                result_docs = sorted(result_docs, key=lambda d: d.score or 0.0, reverse=True)
                print(f"BM25 fallback retrieved {len(result_docs)} documents without filtering.")
                return {"documents": result_docs[:k]}
            except:
                print("BM25 fallback error")
                return {"documents": []}  # Nếu hoàn toàn thất bại, trả về rỗng
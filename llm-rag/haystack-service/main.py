"""
Haystack RAG Service - Document Retrieval & Ranking
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from pathlib import Path
from dotenv import load_dotenv
import pymysql
from datetime import datetime

# load .env (current folder or parent)
_here = Path(__file__).resolve().parent
_env_path = _here / ".env"
if not _env_path.exists():
    _env_path = _here.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)

from haystack import Pipeline, Document
from haystack import component
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.converters.output_adapter import OutputAdapter
from haystack.components.joiners import DocumentJoiner
from haystack.components.retrievers import InMemoryEmbeddingRetriever
try:
    from rank_bm25 import BM25Okapi
    HAS_BM25 = True
    print("OK: BM25 is available")
except Exception:
    HAS_BM25 = False
    print("Warning: BM25 is NOT available")
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.document_stores.in_memory import InMemoryDocumentStore
from sentence_transformers import SentenceTransformer, CrossEncoder

# Define API models
class QueryRequest(BaseModel):
    question: str
    chat_history: Optional[str] = ""
    filters: Optional[Dict[str, Any]] = None
    top_k: int = 20

class RetrievalResponse(BaseModel):
    reformulated_query: str
    documents: List[Dict[str, Any]]
    prompt: str

class MySQLConfig(BaseModel):
    host: str
    port: int = 3306
    user: str
    password: str
    database: str

class IndexRequest(BaseModel):
    mysql_config: MySQLConfig
    query: str
    content_field: str
    metadata_fields: Optional[List[str]] = []
    batch_size: int = 100

class IndexResponse(BaseModel):
    status: str
    total_documents: int
    indexed_documents: int
    failed_documents: int
    errors: List[str] = []

# Set up API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE") or (
    "https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else "https://api.openai.com"
)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    os.environ["OPENAI_API_BASE"] = OPENAI_API_BASE

# FastAPI app
app = FastAPI(title="Haystack RAG Service")

# Define custom reranker component
@component
class CrossEncoderReranker:
    """Cross-encoder reranker using sentence-transformers."""
    
    def __init__(self, model_name: str = "BAAI/bge-reranker-base", top_k: int = 20):
        self.model = CrossEncoder(model_name)
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

# Define custom BM25 retriever component using rank_bm25.BM25Okapi
@component
class BM25OkapiRetriever:
    """BM25 retriever using the rank_bm25 package."""
    
    def __init__(self, document_store, top_k: int = 20):
        self.document_store = document_store
        self.top_k = top_k
        self.bm25 = None
        self.corpus = []
        self.doc_ids = []
        self.initialize()
    
    def initialize(self):
        """Initialize or update BM25 index from document store"""
        docs = self.document_store.filter_documents({})
        if not docs:
            self.corpus = []
            self.doc_ids = []
            self.bm25 = None
            return

        # Tokenize documents for BM25
        self.corpus = [doc.content.lower().split() for doc in docs]
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
        query_tokens = query.lower().split()
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

# Main service class
class HaystackRAGService:
    def __init__(self):
        self.pipeline = None
        self.document_store = None
        self.embedding_model = None  # Single embedding model for all purposes
        self.has_bm25 = False
        self.setup_pipeline()
    
    def setup_pipeline(self):
        """Setup Haystack RAG pipeline"""
        # Initialize embedding model once
        self.embedding_model = SentenceTransformer("intfloat/e5-base-v2")
        
        # Initialize document store
        self.document_store = InMemoryDocumentStore()
        
        # Initialize query embedder component
        query_embedder = SentenceTransformersTextEmbedder(model="intfloat/e5-base-v2")
        
        # Initialize semantic retriever
        embed_retriever = InMemoryEmbeddingRetriever(
            document_store=self.document_store,
            top_k=20
        )
        
        # Check for BM25 availability and initialize it
        bm25_retriever = None
        if HAS_BM25:
            try:
                bm25_retriever = BM25OkapiRetriever(document_store=self.document_store, top_k=20)
                self.has_bm25 = True
            except Exception as e:
                print(f"BM25 initialization error: {e}")
                self.has_bm25 = False
        
        # Initialize reranker
        reranker = CrossEncoderReranker(model_name="BAAI/bge-reranker-base", top_k=20)
        
        # Initialize prompts and LLM
        chat_summary_prompt = PromptBuilder(
            template="""Reformulate the user question if chat history context is needed; otherwise return it unchanged.
Only output the question.

{{ question }}""",
            required_variables=["question"]
        )
        
        chat_summary_llm = OpenAIGenerator(
            model="openai/gpt-3.5-turbo",
            api_base_url=OPENAI_API_BASE,
            generation_kwargs={"max_tokens": 64, "temperature": 0}
        )
        
        replies_to_query = OutputAdapter(template="{{ replies[0] }}", output_type=str)
        
        qa_prompt = PromptBuilder(
            template="""Answer ONLY using the documents. Cite as [n]. If not enough info, say so.

{%- for document in documents %}
[{{ loop.index }}] {{ document.content }}
{%- endfor %}

Question: {{ question }}
Answer:""",
            required_variables=["question", "documents"]
        )
        
        # Build pipeline
        self.pipeline = Pipeline()
        self.pipeline.add_component("chat_summary_prompt", chat_summary_prompt)
        self.pipeline.add_component("chat_summary_llm", chat_summary_llm)
        self.pipeline.add_component("replies_to_query", replies_to_query)
        self.pipeline.add_component("query_embedder", query_embedder)
        self.pipeline.add_component("embed_retriever", embed_retriever)
        
        # Only add BM25 if available
        if self.has_bm25:
            self.pipeline.add_component("bm25_retriever", bm25_retriever)
            joiner = DocumentJoiner()
            self.pipeline.add_component("doc_joiner", joiner)
        
        self.pipeline.add_component("reranker", reranker)
        self.pipeline.add_component("qa_prompt", qa_prompt)
        
        # Connect pipeline components
        self.pipeline.connect("chat_summary_prompt.prompt", "chat_summary_llm.prompt")
        self.pipeline.connect("chat_summary_llm.replies", "replies_to_query.replies")
        self.pipeline.connect("replies_to_query.output", "query_embedder.text")
        self.pipeline.connect("query_embedder.embedding", "embed_retriever.query_embedding")
        self.pipeline.connect("replies_to_query.output", "qa_prompt.question")
        
        # Connect based on whether we have BM25 or not
        if self.has_bm25:
            # BM25 path
            self.pipeline.connect("replies_to_query.output", "bm25_retriever.query")
            # Join results
            self.pipeline.connect("embed_retriever.documents", "doc_joiner.documents")
            self.pipeline.connect("bm25_retriever.documents", "doc_joiner.documents")
            # Rerank joined results
            self.pipeline.connect("doc_joiner.documents", "reranker.documents")
        else:
            # Direct connection without joiner
            self.pipeline.connect("embed_retriever.documents", "reranker.documents")
        
        self.pipeline.connect("replies_to_query.output", "reranker.query")
        self.pipeline.connect("reranker.documents", "qa_prompt.documents")

    def retrieve_documents(self, query: str, filters: Optional[Dict] = None, top_k: int = 20) -> Dict:
        """Run retrieval pipeline"""
        try:
            # Build inputs dictionary
            run_inputs = {
                "chat_summary_prompt": {"question": query},
                "embed_retriever": {"filters": filters, "top_k": top_k},
                "reranker": {"top_k": top_k}
            }
            
            # Add BM25 inputs if available
            if self.has_bm25:
                run_inputs["bm25_retriever"] = {"filters": filters, "top_k": top_k}
                run_inputs["doc_joiner"] = {"top_k": top_k * 2}
            
            # Define outputs to include
            outputs_to_include = ["replies_to_query", "reranker", "qa_prompt"]
            
            # Run pipeline
            run_result = self.pipeline.run(run_inputs, include_outputs_from=outputs_to_include)
            
            # Extract results
            reformulated = run_result.get("replies_to_query", {}).get("output", query)
            final_docs = run_result.get("reranker", {}).get("documents", [])
            prompt = run_result.get("qa_prompt", {}).get("prompt", "")
            
            # Format document results
            documents = []
            for doc in final_docs:
                documents.append({
                    "id": doc.id,
                    "score": getattr(doc, "score", None),
                    "content": doc.content[:1000],  # Limit content length
                    **{k: v for k, v in (doc.meta or {}).items() 
                       if k in ("sku", "size", "color", "price", "stock")}
                })
            
            return {
                "reformulated_query": reformulated,
                "documents": documents,
                "prompt": prompt
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def json_to_documents(self, json_rows, content_field, metadata_fields):
        """Convert JSON rows to Haystack Documents"""
        documents = []
        for idx, row in enumerate(json_rows):
            content = str(row.get(content_field, "")).strip()
            if not content:
                continue
            
            metadata = {
                "source": "mysql",
                "indexed_at": datetime.now().isoformat(),
                "row_index": idx
            }
            
            for field in metadata_fields:
                if field in row and field != content_field:
                    metadata[field] = row[field]
            
            documents.append(Document(content=content, meta=metadata))
        return documents
    
    def index_documents_to_vectordb(self, documents):
        """Add embeddings, index documents, and update BM25"""
        if not documents:
            return {"indexed": 0, "failed": 0, "errors": ["No documents"], "status": "no_data"}
        
        errors = []
        try:
            # Add embeddings
            texts = [d.content for d in documents]
            embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
            for doc, emb in zip(documents, embeddings):
                doc.embedding = emb.tolist()
                
            # Write to document store
            self.document_store.write_documents(documents)
            
            # Update BM25 after indexing
            if self.has_bm25:
                try:
                    bm25_component = self.pipeline.get_component("bm25_retriever")
                    bm25_component.initialize()
                    print(f"BM25 index updated with {len(documents)} new documents.")
                except Exception as e:
                    print(f"Failed to update BM25 index: {e}")
            
            return {
                "indexed": len(documents),
                "failed": 0,
                "errors": errors,
                "status": "completed"
            }
        except Exception as e:
            return {
                "indexed": 0,
                "failed": len(documents),
                "errors": [f"Error: {str(e)}"],
                "status": "failed"
            }
    
    def fetch_mysql_data(self, config, query):
        """Fetch data from MySQL"""
        connection = pymysql.connect(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password,
            database=config.database,
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                return cursor.fetchall()

# Initialize service
rag_service = HaystackRAGService()

@app.post("/retrieve", response_model=RetrievalResponse)
async def retrieve_documents(request: QueryRequest):
    """Retrieve documents based on query"""
    return rag_service.retrieve_documents(
        query=request.question,
        filters=request.filters,
        top_k=request.top_k
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "haystack-rag"}

@app.post("/index/mysql", response_model=IndexResponse)
async def index_from_mysql(request: IndexRequest):
    """Index data from MySQL to Vector Database"""
    try:
        # Fetch data from MySQL
        json_rows = rag_service.fetch_mysql_data(config=request.mysql_config, query=request.query)
        
        if not json_rows:
            return IndexResponse(
                status="no_data",
                total_documents=0,
                indexed_documents=0,
                failed_documents=0,
                errors=["No data returned from MySQL query"]
            )
        
        # Process in batches
        total_docs = len(json_rows)
        indexed_total = 0
        failed_total = 0
        all_errors = []
        
        for i in range(0, total_docs, request.batch_size):
            batch = json_rows[i:i + request.batch_size]
            
            # Convert and index
            documents = rag_service.json_to_documents(
                json_rows=batch,
                content_field=request.content_field,
                metadata_fields=request.metadata_fields
            )
            
            result = rag_service.index_documents_to_vectordb(documents)
            
            indexed_total += result["indexed"]
            failed_total += result["failed"]
            all_errors.extend(result["errors"])
        
        return IndexResponse(
            status="completed" if failed_total == 0 else "partial",
            total_documents=total_docs,
            indexed_documents=indexed_total,
            failed_documents=failed_total,
            errors=all_errors
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index/json", response_model=IndexResponse)
async def index_from_json(
    json_data: List[Dict[str, Any]],
    content_field: str,
    metadata_fields: Optional[List[str]] = []
):
    """Index data from JSON array directly"""
    try:
        if not json_data:
            return IndexResponse(
                status="no_data",
                total_documents=0,
                indexed_documents=0,
                failed_documents=0,
                errors=["No JSON data provided"]
            )
        
        # Convert and index
        documents = rag_service.json_to_documents(
            json_rows=json_data,
            content_field=content_field,
            metadata_fields=metadata_fields
        )
        
        result = rag_service.index_documents_to_vectordb(documents)
        
        return IndexResponse(
            status=result["status"],
            total_documents=len(json_data),
            indexed_documents=result["indexed"],
            failed_documents=result["failed"],
            errors=result["errors"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/index/clear")
async def clear_index():
    """Clear all documents from the vector database"""
    try:
        rag_service.document_store.delete_documents()
        return {"status": "success", "message": "All documents cleared from index"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/index/count")
async def get_document_count():
    """Get total number of documents in the vector database"""
    try:
        count = rag_service.document_store.count_documents()
        return {"total_documents": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
"""
Main RAG service implementation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime

from haystack import Pipeline, Document
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.converters.output_adapter import OutputAdapter
from haystack.components.joiners import DocumentJoiner
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.document_stores.in_memory import InMemoryDocumentStore
from sentence_transformers import SentenceTransformer
from config import HAS_BM25, EMBEDDING_MODEL, RERANKER_MODEL, OPENAI_API_BASE, DEVICE
from haystack.components.embedders import SentenceTransformersTextEmbedder
import pymysql
from fastapi import HTTPException

# Import local modules
from config import HAS_BM25, EMBEDDING_MODEL, RERANKER_MODEL, OPENAI_API_BASE
from components.retriever import BM25OkapiRetriever
from components.reranker import CrossEncoderReranker

class HaystackRAGService:
    def __init__(self):
        self.pipeline = None
        self.document_store = None
        self.embedding_model = None  # Single embedding model for all purposes
        self.has_bm25 = False
        self.setup_pipeline()
    
    def setup_pipeline(self):
        """Setup Haystack RAG pipeline"""
        # Initialize embedding model and move to device
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        try:
            self.embedding_model.to(DEVICE)
        except Exception:
            pass
        
        # Initialize document store
        self.document_store = InMemoryDocumentStore()
        
        # Initialize query embedder component (do not pass device param into init)
        query_embedder = SentenceTransformersTextEmbedder(model=EMBEDDING_MODEL)
        
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
        reranker = CrossEncoderReranker(model_name=RERANKER_MODEL, top_k=20)
        
        # Initialize prompts and LLM
        chat_summary_prompt = PromptBuilder(
            template="""Bạn là trợ lý bán hàng. Diễn đạt lại câu hỏi của khách. Ví dụ:
            ```
            Khách hàng đang hỏi về sản phẩm quần áo, bao gồm các chi tiết như kích thước, màu sắc, giá cả và tình trạng kho hàng.
            ```

            Phân tích hội thoại hiện tại để trả lời:
            ```
            {{ question }}
            ```

            Tổng hợp tất cả thông tin quan trọng từ hội thoại: mã sản phẩm, size, màu sắc, cân nặng, chiều cao.
            Tạo câu hỏi đầy đủ, súc tích, dùng để truy xuất tài liệu.""",
            required_variables=["question"]
        )
        
        chat_summary_llm = OpenAIGenerator(
            model="openai/gpt-3.5-turbo",
            api_base_url=OPENAI_API_BASE,
            generation_kwargs={"max_tokens": 1000, "temperature": 0}
        )
        
        replies_to_query = OutputAdapter(template="{{ replies[0] }}", output_type=str)
        
        qa_prompt = PromptBuilder(
            template="""Hãy trả lời câu hỏi CHỈ dựa trên thông tin từ các tài liệu dưới đây. Sử dụng số tham chiếu [n] khi trích dẫn thông tin cụ thể.
            Nếu tài liệu không cung cấp đủ thông tin, hãy nói rõ rằng bạn không có thông tin đó.
            Trả lời ngắn gọn, súc tích và chuyên nghiệp như một nhân viên bán quần áo.

            {%- for document in documents %}
            [{{ loop.index }}] {{ document.content }}
            {%- endfor %}

            Câu hỏi: {{ question }}
            Trả lời:""",
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
            documents = self._format_documents(final_docs)
            
            return {
                "reformulated_query": reformulated,
                "documents": documents,
                "prompt": prompt
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def _format_documents(self, docs):
        """Format documents for API response"""
        documents = []
        for doc in docs:
            documents.append({
                "id": doc.id,
                "score": getattr(doc, "score", None),
                "content": doc.content[:1000],  # Limit content length
                **{k: v for k, v in (doc.meta or {}).items() 
                   if k in ("sku", "size", "color", "price", "stock")}
            })
        return documents
    
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
"""
API models for the RAG service
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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
    document_ids: List[str] = []

class IndexRequestJson(BaseModel):
    json_data: List[Dict[str, Any]]
    content_field: str
    metadata_fields: Optional[List[str]] = []


# Thêm vào cuối file
class DocumentInfoRequest(BaseModel):
    document_id: Optional[str] = None  # không bắt buộc, có thể None
    name: str
    description: Optional[str] = ""    # cũng có thể None hoặc chuỗi rỗng
    source_type: Optional[str] = "json"
    tags: List[str] = []

class IndexRequestJson(BaseModel):
    json_data: List[Dict[str, Any]]
    content_field: str
    metadata_fields: Optional[List[str]] = []
    document_info: DocumentInfoRequest

class IndexResponse(BaseModel):
    status: str
    total_documents: int
    indexed_documents: int
    failed_documents: int
    errors: List[str] = []
    document_ids: List[str] = []
    document_id: Optional[str] = None

class DocumentInfo(BaseModel):
    document_id: str
    name: str
    source_type: str
    description: str = ""
    chunk_count: int
    last_updated: str
    tags: List[str] = []

class DocumentsListResponse(BaseModel):
    documents: List[DocumentInfo]

class ChunkInfo(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]
    enabled: bool = True

class ChunksListResponse(BaseModel):
    chunks: List[ChunkInfo]
    document_info: DocumentInfo

class UpdateChunkRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None
    enabled: bool = True
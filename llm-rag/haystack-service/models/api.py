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
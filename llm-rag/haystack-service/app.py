"""
Haystack RAG Service - Document Retrieval & Ranking FastAPI Application
"""
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException

# Import local modules
from models.api import QueryRequest, RetrievalResponse, IndexRequest, IndexResponse
from services.rag_service import HaystackRAGService

# FastAPI app
app = FastAPI(title="Haystack RAG Service")

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
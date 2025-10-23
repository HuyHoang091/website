import React, { useState, useEffect } from 'react';
import DocumentList from './DocumentList';
import ChunkList from './ChunkList';
import Toast from '../../Toast/Toast';
import styles from './RAGManager.module.css';

const API_URL = 'http://localhost:8002';

const RAGManager = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemDocumentId, setSystemDocumentId] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const showToast = (message, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        removeToast(id);
      }, 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  
  // Fetch documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/documents`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
      
      // Determine if we already have a system document
      const systemDoc = data.documents?.find(doc => 
        doc.name.toLowerCase().includes('system') || 
        doc.source_type.toLowerCase() === 'system'
      );
      
      if (systemDoc) {
        setSystemDocumentId(systemDoc.document_id);
      }
      
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle document selection
  const handleSelectDocument = (documentId) => {
    setSelectedDocument(documentId);
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Push system test data
  const handlePushSystemData = async (documentId, documentName) => {
    setLoading(true);
    try {
      // Create 5 test chunks with system identifier
      const testData = [
        { content: "Đây là dữ liệu hệ thống mẫu 1", category: "system", importance: "high" },
        { content: "Đây là dữ liệu hệ thống mẫu 2", category: "system", importance: "medium" },
        { content: "Đây là dữ liệu hệ thống mẫu 3", category: "system", importance: "low" },
        { content: "Đây là dữ liệu hệ thống mẫu 4", category: "system", importance: "high" },
        { content: "Đây là dữ liệu hệ thống mẫu 5", category: "system", importance: "medium" }
      ];
      
      const response = await fetch(`${API_URL}/index/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          json_data: testData,
          content_field: "content",
          metadata_fields: ["category", "importance"],
          document_info: {
            document_id: documentId ? documentId : undefined,
            name: documentName ? documentName : "System Data",
            description: "System data for RAG processing",
            source_type: "system",
            tags: ["system", "test", "data"]
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSystemDocumentId(result.document_id);
      
      // Refresh document list
      fetchDocuments();
      
      showToast("System data successfully pushed to RAG!");
    } catch (err) {
      console.error('Error pushing system data:', err);
      setError(err.message);
      showToast(`Failed to push system data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete document
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Remove document from state
      setDocuments(documents.filter(doc => doc.document_id !== documentId));
      
      // If deleted document was selected, clear selection
      if (selectedDocument === documentId) {
        setSelectedDocument(null);
      }
      
      // If deleted document was system document, clear systemDocumentId
      if (systemDocumentId === documentId) {
        setSystemDocumentId(null);
      }
      
      showToast('Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      showToast(`Failed to delete document: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter documents by search term
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles["rag-manager"]}>
      <header className={styles["rag-header"]}>
        <h1><i className="fas fa-database"></i> RAG Document Management</h1>
        <div className={styles["header-controls"]}>
          <input 
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles["search-input"]}
          />
          <button className={styles["add-file-btn"]} disabled>
            <i className="fas fa-file-upload"></i> Add File
          </button>
        </div>
      </header>

      {error && <div className={styles["error-message"]}>Error: {error}</div>}

      {!selectedDocument ? (
        <DocumentList 
          documents={filteredDocuments}
          systemDocumentId={systemDocumentId}
          onSelectDocument={handleSelectDocument}
          onPushSystemData={handlePushSystemData}
          onDeleteDocument={handleDeleteDocument}
          onRefreshDocuments={fetchDocuments}
          loading={loading}
          styles={styles}
        />
      ) : (
        <ChunkList 
          documentId={selectedDocument}
          onBack={() => setSelectedDocument(null)}
          onRefresh={fetchDocuments}
          showToast={showToast}
          styles={styles}
        />
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default RAGManager;
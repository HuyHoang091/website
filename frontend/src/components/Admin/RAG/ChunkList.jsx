import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8002';

const ChunkList = ({ documentId, onBack, onRefresh, showToast, styles }) => {
  const [chunks, setChunks] = useState([]);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingChunk, setIsAddingChunk] = useState(false);
  const [newChunkData, setNewChunkData] = useState({
    content: '',
    metadata: {}
  });
  
  // Fetch chunks on mount and when documentId changes
  useEffect(() => {
    fetchChunks();
  }, [documentId]);
  
  // Fetch chunks from API
  const fetchChunks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/chunks`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setChunks(data.chunks || []);
      setDocumentInfo(data.document_info);
    } catch (err) {
      console.error('Error fetching chunks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Toggle chunk selection
  const handleToggleChunk = (chunkId) => {
    if (selectedChunks.includes(chunkId)) {
      setSelectedChunks(selectedChunks.filter(id => id !== chunkId));
    } else {
      setSelectedChunks([...selectedChunks, chunkId]);
    }
  };
  
  // Toggle all chunks selection
  const handleSelectAll = () => {
    if (selectedChunks.length === chunks.length) {
      setSelectedChunks([]);
    } else {
      setSelectedChunks(chunks.map(chunk => chunk.id));
    }
  };
  
  // Enable selected chunks
  const handleEnableChunks = async () => {
    if (selectedChunks.length === 0) {
      showToast('Please select chunks to enable', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const promises = selectedChunks.map(chunkId => 
        fetch(`${API_URL}/chunks/${chunkId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: chunks.find(c => c.id === chunkId).content,
            metadata: chunks.find(c => c.id === chunkId).metadata,
            enabled: true
          })
        })
      );
      
      await Promise.all(promises);
      
      // Refresh chunks
      fetchChunks();
      
      // Clear selection
      setSelectedChunks([]);
      
      showToast('Selected chunks enabled successfully');
    } catch (err) {
      console.error('Error enabling chunks:', err);
      showToast(`Failed to enable chunks: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Disable selected chunks
  const handleDisableChunks = async () => {
    if (selectedChunks.length === 0) {
      showToast('Please select chunks to disable', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const promises = selectedChunks.map(chunkId => 
        fetch(`${API_URL}/chunks/${chunkId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: chunks.find(c => c.id === chunkId).content,
            metadata: chunks.find(c => c.id === chunkId).metadata,
            enabled: false
          })
        })
      );
      
      await Promise.all(promises);
      
      // Refresh chunks
      fetchChunks();
      
      // Clear selection
      setSelectedChunks([]);

      showToast('Selected chunks disabled successfully');
    } catch (err) {
      console.error('Error disabling chunks:', err);
      showToast(`Failed to disable chunks: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete selected chunks
  const handleDeleteChunks = async () => {
    if (selectedChunks.length === 0) {
      showToast('Please select chunks to delete', 'info');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedChunks.length} chunks?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const promises = selectedChunks.map(chunkId => 
        fetch(`${API_URL}/chunks/${chunkId}`, {
          method: 'DELETE'
        })
      );
      
      await Promise.all(promises);
      
      // Refresh chunks
      fetchChunks();
      
      // Clear selection
      setSelectedChunks([]);
      
      // Update parent component
      onRefresh();

      showToast('Selected chunks deleted successfully');
    } catch (err) {
      console.error('Error deleting chunks:', err);
      showToast(`Failed to delete chunks: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle new chunk form change
  const handleNewChunkChange = (e) => {
    const { name, value } = e.target;
    setNewChunkData({
      ...newChunkData,
      [name]: value
    });
  };
  
  // Add new chunk
  const handleAddNewChunk = async () => {
    if (!newChunkData.content.trim()) {
      showToast('Content cannot be empty', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data for new chunk
      const chunkData = {
        json_data: [{
          content: newChunkData.content,
          // Add any additional fields needed for your metadata
        }],
        content_field: "content",
        metadata_fields: [],
        document_info: {
          document_id: documentId,
          name: documentInfo.name,
          description: documentInfo.description,
          source_type: documentInfo.source_type,
          tags: documentInfo.tags || []
        }
      };
      
      // Add document_id to match with existing document
      // chunkData.document_info.document_id = documentId;
      
      // Send request to add new chunk
      const response = await fetch(`${API_URL}/index/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chunkData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Reset form and refresh
      setNewChunkData({
        content: '',
        metadata: {}
      });
      setIsAddingChunk(false);
      fetchChunks();
      onRefresh();
      
    } catch (err) {
      console.error('Error adding new chunk:', err);
      showToast(`Failed to add new chunk: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter chunks by search term
  const filteredChunks = chunks.filter(chunk => 
    chunk.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !chunks.length) {
    return <div className={styles["loading"]}>Loading chunks...</div>;
  }

  if (error) {
    return <div className={styles["error-message"]}>Error loading chunks: {error}</div>;
  }

  return (
    <div className={styles["chunk-list"]}>
      <div className={styles["chunk-header"]}>
        <button className={`${styles["btn"]} ${styles["back-btn"]}`} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Documents
        </button>
        <h2>{documentInfo?.name} Chunks</h2>
        <button 
          className={`${styles["btn"]} ${styles["reload-btn"]}`}
          onClick={fetchChunks}
          disabled={loading}
        >
          <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`}></i> Refresh Chunks
        </button>
      </div>

      <div className={styles["chunk-actions"]}>
        <button 
          className={`${styles["btn"]} ${styles["select-all-btn"]}`}
          onClick={handleSelectAll}
        >
          {selectedChunks.length === chunks.length ? 'Deselect All' : 'Select All'}
        </button>
        <button 
          className={`${styles["btn"]} ${styles["enable-btn"]}`}
          onClick={handleEnableChunks}
          disabled={loading || selectedChunks.length === 0}
        >
          <i className="fas fa-toggle-on"></i> Enable
        </button>
        <button 
          className={`${styles["btn"]} ${styles["disable-btn"]}`}
          onClick={handleDisableChunks}
          disabled={loading || selectedChunks.length === 0}
        >
          <i className="fas fa-toggle-off"></i> Disable
        </button>
        <button 
          className={`${styles["btn"]} ${styles["delete-btn"]}`}
          onClick={handleDeleteChunks}
          disabled={loading || selectedChunks.length === 0}
        >
          <i className="fas fa-trash"></i> Delete
        </button>
        <input 
          type="text"
          placeholder="Search chunks..."
          value={searchTerm}
          onChange={handleSearch}
          className={styles["search-input"]}
        />
        <button 
          className={`${styles["btn"]} ${styles["add-btn"]}`}
          onClick={() => setIsAddingChunk(true)}
        >
          <i className="fas fa-plus"></i> Add Chunk
        </button>
      </div>

      {/* Add new chunk form */}
      {isAddingChunk && (
        <div className={styles["add-chunk-form"]}>
          <h3>Add New Chunk</h3>
          <div className={styles["form-group"]}>
            <label>Content:</label>
            <textarea
              name="content"
              value={newChunkData.content}
              onChange={handleNewChunkChange}
              rows="4"
              placeholder="Enter chunk content"
              className={styles["form-control"]}
            ></textarea>
          </div>
          <div className={styles["form-actions"]}>
            <button
              className={`${styles["btn"]} ${styles["save-btn"]}`}
              onClick={handleAddNewChunk}
              disabled={loading}
            >
              <i className="fas fa-save"></i> Save Chunk
            </button>
            <button
              className={`${styles["btn"]} ${styles["cancel-btn"]}`}
              onClick={() => setIsAddingChunk(false)}
              disabled={loading}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles["table-container"]}>
        <table>
          <thead>
            <tr>
              <th className={styles["select-column"]}>Select</th>
              <th>Content</th>
              <th className={styles["enable-column"]}>Enable</th>
            </tr>
          </thead>
          <tbody>
            {filteredChunks.length === 0 ? (
              <tr>
                <td colSpan="3" className={styles["no-data"]}>No chunks found</td>
              </tr>
            ) : (
              filteredChunks.map(chunk => (
                <tr key={chunk.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedChunks.includes(chunk.id)}
                      onChange={() => handleToggleChunk(chunk.id)}
                    />
                  </td>
                  <td className={styles["content-cell"]}>{chunk.content}</td>
                  <td>
                    <label className={styles["toggle-switch"]}>
                      <input 
                        type="checkbox" 
                        checked={chunk.enabled}
                        onChange={async () => {
                          setLoading(true);
                          try {
                            await fetch(`${API_URL}/chunks/${chunk.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                content: chunk.content,
                                metadata: chunk.metadata,
                                enabled: !chunk.enabled
                              })
                            });
                            fetchChunks();
                          } catch (err) {
                            console.error('Error toggling chunk:', err);
                            showToast(`Failed to toggle chunk: ${err.message}`, 'error');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                      <span className={styles["toggle-slider"]}></span>
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChunkList;
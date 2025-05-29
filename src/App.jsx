import { useState, useEffect } from 'react';
import { useUser } from '../lib/context/user';
import { FaTimes, FaSearch, FaFilter, FaEdit, FaTrash, FaUser } from 'react-icons/fa';

function App() {
  const { loading, user, documents, total, createDocument, updateDocument, deleteDocument, login, logout } = useUser();
  
  const [filters, setFilters] = useState({
    folder: '',
    message: '',
    owner: '',
    limit: '',
    page: '',
    sort: ''
  });

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [modalType, setModalType] = useState(null); // "edit" | "delete" | "filter" | "bulk-delete" | "create" | "logout"
  const [editForm, setEditForm] = useState({ folder: '', message: '' });
  const [createForm, setCreateForm] = useState({ folder: '', message: '' });
  const [error, setError] = useState(null);

  // Initialize filters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      folder: params.get('folder') || '',
      message: params.get('message') || '',
      owner: params.get('owner') || '',
      limit: Number(params.get('limit')) || '',
      page: Number(params.get('page')) || '',
      sort: params.get('sort') || ''
    });
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && closeModal();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set edit form when modal opens
  useEffect(() => {
    if (modalType === 'edit' && selectedDoc) {
      setEditForm({ folder: selectedDoc.folder, message: selectedDoc.message });
    }
  }, [modalType, selectedDoc]);

  const toggleDocSelection = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.$id));
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== '') params.append(key, val);
    });
    
    const newUrl = params.size > 0 
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    
    window.location.href = newUrl;
  };

  const resetFilters = () => {
    setFilters({
      folder: '',
      message: '',
      owner: '',
      limit: '',
      page: '',
      sort: ''
    });
  };

  const openModal = (doc, type) => {
    setSelectedDoc(doc);
    setModalType(type);
    document.body.classList.add('no-scroll');
  };

  const closeModal = () => {
    setSelectedDoc(null);
    setModalType(null);
    document.body.classList.remove('no-scroll');
  };

  const handleEditSubmit = async () => {
    try {
      if(editForm.folder === "")
      {
        setError("Please enter a folder");
        return;
      }
      else if(editForm.message === "")
      {
        setError("Please enter a message");
        return; 
      }
      await updateDocument({ ...selectedDoc, ...editForm });
      closeModal();
      setError(null);
    } catch (error) {
      if (!user) {
        setError('Not logged in');
      } else {
        setError('Failed to update document');
      }
    }
  };

  const handleCreateSubmit = async () => {
    try {
      if(createForm.folder === "")
      {
        setError("Please enter a folder");
        return;
      }
      else if(createForm.message === "")
      {
        setError("Please enter a message");
        return; 
      }
      await createDocument(createForm);
      closeModal();
      setError(null);
    } catch (error) {
      if (!user) {
        setError('Not logged in');
      } else {
        setError('Failed to create document');
      }
    }
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await deleteDocument(selectedDoc.$id);
      closeModal();
      setSelectedDocs([]);
      setError(null);
    } catch (error) {
      if (!user) {
        setError('Not logged in');
      } else {
        setError('Failed to delete document');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedDocs.map(id => deleteDocument(id)));
      setSelectedDocs([]);
      closeModal();
      setError(null);
    } catch (error) {
      if (!user) {
        setError('Not logged in');
      } else {
        setError('Failed to delete documents');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeModal();
      setError(null);
    } catch (error) {
      setError('Failed to logout');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <img src="/eba.png" alt="Loading" className="loading-logo" />
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <img src="/eba.png" alt="Logo" className="logo-img" />
          <h1>Evabot</h1>
        </div>
        <div className="header-right">
          {user ? (
            <button className="user-btn" onClick={() => openModal(null, 'logout')}>
              <FaUser /> {user.name}
            </button>
          ) : (
            <button className="login-btn" onClick={login}>Login</button>
          )}
        </div>
      </header>
      
      <main className="main-content">
        {documents.length > 0 ? (
          <>
            <div className="table-controls">
              <div className="controls-left">
                <button 
                  className="btn primary"
                  onClick={() => {
                    setCreateForm({ folder: '', message: '' });
                    openModal(null, 'create');
                  }}
                >
                  + Create
                </button>
                <button 
                  className="btn primary"
                  onClick={() => openModal(null, 'filter')}
                >
                  <FaFilter /> Filters
                </button>
                {selectedDocs.length > 0 && (
                  <button 
                    className="btn danger"
                    onClick={() => openModal(null, 'bulk-delete')}
                  >
                    <FaTrash /> Delete ({selectedDocs.length})
                  </button>
                )}
              </div>
            </div>

            <h4>Showing {documents.length} of {total} messages</h4>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={selectedDocs.length === documents.length && documents.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Folder</th>
                    <th>Message</th>
                    <th>Owner</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.$id}>
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(doc.$id)}
                          onChange={() => toggleDocSelection(doc.$id)}
                        />
                      </td>
                      <td>{doc.folder}</td>
                      <td>
                        {doc.message.startsWith('https://') ? (
                          <a href={doc.message} target="_blank" rel="noopener noreferrer">
                            {doc.message}
                          </a>
                        ) : (
                          doc.message
                        )}
                      </td>
                      <td>
                        {doc.createdBy || 'simok123'}
                      </td>
                      <td className="actions-column">
                        <div className="actions">
                          <button onClick={() => openModal(doc, 'edit')}>
                            <FaEdit />
                          </button>
                          <button onClick={() => openModal(doc, 'delete')}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No messages found</p>
            <button 
              className="btn primary"
              onClick={() => openModal(null, 'filter')}
            >
              <FaFilter /> Adjust filters
            </button>
          </div>
        )}
      </main>

      {/* Logout Modal */}
      {modalType === 'logout' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {modalType === 'filter' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Filter Messages</h2>
            
            <div className="form-group">
              <label>Folder</label>
              <input
                type="text"
                value={filters.folder}
                onChange={(e) => setFilters({...filters, folder: e.target.value.toLowerCase()})}
                placeholder="Search by folder"
              />
            </div>
            
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={filters.message}
                onChange={(e) => setFilters({...filters, message: e.target.value})}
                placeholder="Search by message"
              />
            </div>

            <div className="form-group">
              <label>Owner</label>
              <input
                type="text"
                value={filters.owner}
                onChange={(e) => setFilters({...filters, owner: e.target.value})}
                placeholder="Search by owner"
              />
            </div>
            
            <div className="form-group">
              <label>Results per page</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: Number(e.target.value)})}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Sort order</label>
              <select
                value={folders.sort || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  switch (value) {
                    case 'newest':
                      setFilters({ ...filters, sort: 'newest' });
                      break;
                    case 'oldest':
                      setFilters({ ...filters, sort: 'oldest' });
                      break;
                    case 'hot':
                      setFilters({ ...filters, sort: 'hot' });
                      break;
                    case 'cold':
                      setFilters({ ...filters, sort: 'cold' });
                      break;
                    default:
                      setFilters({ ...filters, sort: '' });
                  }
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="hot">Hot</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn primary" onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalType === 'create' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Create New Message</h2>
      
            <div className="form-group">
              <label>Folder</label>
              <input
                type="text"
                value={createForm.folder}
                onChange={(e) => setCreateForm({ ...createForm, folder: e.target.value.toLowerCase() })}
                placeholder="Enter folder name"
              />
            </div>
      
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                placeholder="Enter message"
              />
            </div>
      
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleCreateSubmit}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === 'edit' && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Edit Message</h2>
            
            <div className="form-group">
              <label>Folder</label>
              <input
                type="text"
                value={editForm.folder}
                onChange={(e) => setEditForm({...editForm, folder: e.target.value.toLowerCase() })}
              />
            </div>
            
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={editForm.message}
                onChange={(e) => setEditForm({...editForm, message: e.target.value})}
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleEditSubmit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === 'delete' && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Confirm Deletion</h2>
            
            <p>Are you sure you want to delete this message?</p>
            <div className="document-preview">
              <p><strong>Folder:</strong> {selectedDoc.folder}</p>
              <p><strong>Message:</strong> {selectedDoc.message}</p>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleDeleteConfirm}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {modalType === 'bulk-delete' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Confirm Bulk Deletion</h2>
            
            <p>Are you sure you want to delete {selectedDocs.length} selected messages?</p>
            <div className="document-preview">
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleBulkDelete}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setError(null)}>
              <FaTimes />
            </button>
            <h2>Error</h2>
            
            <div className="error-content">
              <p>{error}</p>
            </div>
            
            <div className="modal-actions">
              <button className="btn primary" onClick={() => setError(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

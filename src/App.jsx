import { useState, useEffect } from 'react';
import { useUser } from '../lib/context/user';
import { FaTimes, FaFilter, FaEdit, FaTrash, FaUser, FaMoon, FaSun } from 'react-icons/fa';

function App() {
  const { loading, user, documents, total, createDocument, updateDocument, deleteDocument, login, logout } = useUser();
  
  const [filters, setFilters] = useState({
    folder: '',
    message: '',
    owner: '',
    sort: 'newest',
    page: 1,
    limit: 10,
  });

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [editForm, setEditForm] = useState({ folder: '', message: '' });
  const [createForm, setCreateForm] = useState({ folder: '', message: '' });
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      folder: params.get('folder') || '',
      message: params.get('message') || '',
      owner: params.get('owner') || '',
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 10,
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && closeModal();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const updateUrlParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val !== '' && !(key === 'limit' && val === 10) && !(key === 'page' && val === 1) && !(key === 'sort' && val === "newest")) {
        params.append(key, val.toString());
      }
    });
    
    const newUrl = params.size > 0 
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    
    window.history.pushState({}, '', newUrl);
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const newFilters = { ...filters, page: 1, limit: 10 };
    updateUrlParams(newFilters);
    window.location.reload();
  };

  const resetFilters = () => {
    const resetFilters = {
      folder: '',
      message: '',
      owner: '',
      sort: 'newest',
      page: 1,
      limit: 10,
    };
    setFilters(resetFilters);
    updateUrlParams(resetFilters);
    window.location.reload();
  };

  const goToPage = (page) => {
    const newFilters = { ...filters, page };
    updateUrlParams(newFilters);
    window.location.reload();
  };

  const changeResultsPerPage = (limit) => {
    const newFilters = { ...filters, limit, page: 1 };
    updateUrlParams(newFilters);
    window.location.reload();
  };

  const openModal = (doc, type) => {
    setSelectedDoc(doc);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedDoc(null);
    setModalType(null);
    setError(null);
  };

  const handleEditSubmit = async () => {
    try {
      if (editForm.folder === "") {
        setError("Please enter a folder");
        return;
      } else if (editForm.message === "") {
        setError("Please enter a message");
        return; 
      }
      await updateDocument({ ...selectedDoc, ...editForm });
      closeModal();
    } catch (error) {
      setError(user ? 'Failed to update message' : 'Not logged in');
    }
  };

  const handleCreateSubmit = async () => {
    try {
      if (createForm.folder === "") {
        setError("Please enter a folder");
        return;
      } else if (createForm.message === "") {
        setError("Please enter a message");
        return; 
      }
      await createDocument(createForm);
      setCreateForm({ folder: '', message: '' });
      closeModal();
      resetFilters();
    } catch (error) {
      setError(user ? 'Failed to create message' : 'Not logged in');
    }
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await deleteDocument(selectedDoc.$id);
      closeModal();
      setSelectedDocs([]);
    } catch (error) {
      setError(user ? 'Failed to delete message' : 'Not logged in');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedDocs.map(id => deleteDocument(id)));
      closeModal();
    } catch (error) {
      setError(user ? 'Failed to delete all messages' : 'Not logged in');
    }
    finally
    {
      setSelectedDocs([]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeModal();
    } catch (error) {
      setError('Failed to logout');
    }
  };

 function getRelativeTime(date) {
    const now = Date.now();
    const pastDate = date.getTime();
	 
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    const diffInSeconds = Math.floor((now - pastDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInMonths / 12);

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInMinutes < 60) {
       return rtf.format(-diffInMinutes, 'minute');
    } else if (diffInHours < 24) {
       return rtf.format(-diffInHours, 'hour');
    } else if (diffInDays < 30) {
      return rtf.format(-diffInDays, 'day');
    } else if(diffInMonths < 12) {
      return rtf.format(-diffInMonths, 'month');
	} else {
      return rtf.format(-diffInYears, 'year');
    }
}

  
  const totalPages = Math.ceil(total / filters.limit);
  const currentPage = filters.page;

  if (loading) return (
  <div className="loading-screen">
    <div className="loading-logo-placeholder">
      <img src="/eba.png" alt="Logo" />
    </div>
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>

  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo-placeholder"><img src="/eba.png"/></div>
            <h1>EvaBot</h1>
          </div>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleDarkMode} title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          {user ? (
            <button className="user-btn" onClick={() => openModal(null, 'logout')}>
              <FaUser className="mr-2" /> {user.name}
            </button>
          ) : (
            <button className="login-btn" onClick={login}>Sign In</button>
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
                  onClick={() => openModal(null, 'create')}
                >
                  Create Message
                </button>
                <button 
                  className="btn secondary"
                  onClick={() => openModal(null, 'filter')}
                >
                  <FaFilter className="mr-2" /> Filter
                </button>
                {selectedDocs.length > 0 && (
                  <button 
                    className="btn danger"
                    onClick={() => openModal(null, 'bulk-delete')}
                  >
                    <FaTrash className="mr-2" /> Delete ({selectedDocs.length})
                  </button>
                )}
              </div>
              <div className="controls-right">
                <div className="results-info">
                    
                      {total === 5000 ? (
                       <p>
                        Showing {total === 0 ? 0 : ((filters.page ? parseInt(filters.page) : 1) - 1) * (filters.limit ? parseInt(filters.limit) : 10) + 1}
                      {' '}to{' '}
                      {Math.min((filters.page ? parseInt(filters.page) : 1) * (filters.limit ? parseInt(filters.limit) : 10), total)}
                      </p>
                      ) : (
                        <p>
                        Showing {total === 0 ? 0 : ((filters.page ? parseInt(filters.page) : 1) - 1) * (filters.limit ? parseInt(filters.limit) : 10) + 1}
                      {' '}to{' '}
                      {Math.min((filters.page ? parseInt(filters.page) : 1) * (filters.limit ? parseInt(filters.limit) : 10), total)} of {total} messages
                      </p>

                      )}
                </div>
              </div>
            </div>

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
                    <th>Created</th>
                    <th>Updated</th>
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
                      <td>
                        <span className="folder-tag">{doc.folder}</span>
                      </td>
                      <td className="message-cell">
                        {doc.message.startsWith('https://') ? (
                          <a href={doc.message} target="_blank" rel="noopener noreferrer" className="external-link">
                            {doc.message}
                          </a>
                        ) : (
                          <span className="message-text">{doc.message}</span>
                        )}
                      </td>
                      <td>
                        <div className="owner-info">
                          <span className="owner-name">{doc.createdBy || 'simok123'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="owner-info">
                          <span className="owner-name">{getRelativeTime(new Date(doc.$createdAt))}</span>
                        </div>
                      </td>
                      <td>
                        <div className="owner-info">
                          <span className="owner-name">{getRelativeTime(new Date(doc.$updatedAt))}</span>
                        </div>
                      </td>
                      <td className="actions-column">
                        <div className="actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => openModal(doc, 'edit')}
                            title="Edit message"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => openModal(doc, 'delete')}
                            title="Delete message"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-container">
              <div className="pagination-left">
                <div className="results-per-page">
                  <label>Results per page:</label>
                  <select
                    value={filters.limit}
                    onChange={(e) => changeResultsPerPage(Number(e.target.value))}
                    className="pagination-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              <div className="pagination-center">
                <div className="pagination-info">
                  {total === 5000 ? (
                    <p>
                      Page {currentPage}
                    </p>
                  ): (
                    <p>
                      Page {currentPage} of {totalPages}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="pagination-right">
                <div className="pagination-controls">
                  {currentPage > 2 && (
                    <button 
                      className="pagination-btn"
                      onClick={() => goToPage(1)}
                    >
                      First
                    </button>
                  )}
                  
                  {currentPage > 1 && (
                    <button 
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Prev
                    </button>
                  )}
                  
                  <button className="pagination-btn active">
                    {currentPage}
                  </button>
                  
                  {currentPage < totalPages && (
                    <button 
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  )}
                  
                  {(currentPage < totalPages - 1) &&  total < 5000 && (
                    <button 
                      className="pagination-btn"
                      onClick={() => goToPage(totalPages)}
                    >
                      Last
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>No Messages Found</h3>
            <p>Create a new message or adjust your filters to get started.</p>
            <div className="empty-actions">
              <button 
                className="btn primary"
                onClick={() => openModal(null, 'create')}
              >
                Create Message
              </button>
              <button 
                className="btn secondary"
                onClick={() => openModal(null, 'filter')}
              >
                <FaFilter className="mr-2" /> Filter
              </button>
            </div>
          </div>
        )}
      </main>

      {modalType === 'logout' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Sign Out</h2>
            <p>Are you sure you want to sign out?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Filter by folder"
              />
            </div>
            
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={filters.message}
                onChange={(e) => setFilters({...filters, message: e.target.value})}
                placeholder="Filter by message"
              />
            </div>

            <div className="form-group">
              <label>Owner</label>
              <input
                type="text"
                value={filters.owner}
                onChange={(e) => setFilters({...filters, owner: e.target.value})}
                placeholder="Filter by owner"
              />
            </div>
            
            <div className="form-group">
              <label>Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="hot">Hot</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={resetFilters}>
                Clear
              </button>
              <button className="btn primary" onClick={applyFilters}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'create' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Create Message</h2>
      
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
                placeholder="Enter message or URL"
              />
            </div>
      
            {error && (
              <div className="error-content">
                <p>{error}</p>
              </div>
            )}
      
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
                placeholder="Enter folder name"
              />
            </div>
            
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={editForm.message}
                onChange={(e) => setEditForm({...editForm, message: e.target.value})}
                placeholder="Enter message or URL"
              />
            </div>
            
            {error && (
              <div className="error-content">
                <p>{error}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleEditSubmit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'delete' && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <h2>Delete Message</h2>
            
            <p>Are you sure you want to delete this message?</p>
            <div className="document-preview">
              <p><strong>Folder:</strong> {selectedDoc.folder}</p>
              <p><strong>Message:</strong> {selectedDoc.message}</p>
            </div>
            
            {error && (
              <div className="error-content">
                <p>{error}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'bulk-delete' && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>

            
            {error ? (
              <>
              <h2>An error occurred</h2>
              <div className="document-preview">
                <p>Unable to process your request</p>
              </div>
              </>
            ) : (
               <>
                <h2>Delete Messages</h2>
                <p>Are you sure you want to delete {selectedDocs.length} message{selectedDocs.length > 1 ? 's' : ''}?</p>
                <div className="document-preview">
                  <p>This action cannot be undone.</p>
                </div>
              </>
            )}
        
            
            {error && (
              <div className="error-content">
                <p>{error}</p>
              </div>
            )}
            
            <div className="modal-actions">
              {error ? 
                (
             <button className="btn secondary" onClick={closeModal}>
                Cancel
              </button>
                ): (
                  <>
                   <button className="btn secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="btn danger" onClick={handleBulkDelete}>
                    Delete
                  </button>
                  </>
                )}
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

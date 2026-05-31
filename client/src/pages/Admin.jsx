import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard Data State
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [uptime, setUptime] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [apiLimit, setApiLimit] = useState('Unlimited');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'feedback'
  const [expandedUserId, setExpandedUserId] = useState(null);

  // College Database State
  const [collegesList, setCollegesList] = useState([]);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [isAddingCollege, setIsAddingCollege] = useState(false);

  // Authenticate locally using standard admin credentials
  useEffect(() => {
    const adminSession = sessionStorage.getItem('adminSessionActive');
    if (adminSession === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
      fetchColleges();
    }
  }, []);

  // Ticking effect to increment server uptime live on UI
  useEffect(() => {
    let interval = null;
    if (isAuthenticated && uptime > 0) {
      interval = setInterval(() => {
        setUptime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, uptime]);

  const formatUptime = (totalSeconds) => {
    if (!totalSeconds) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const fetchColleges = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/colleges`
      );
      if (response.data.success) {
        setCollegesList(response.data.colleges);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!newCollegeName.trim()) {
      alert("College name cannot be empty.");
      return;
    }
    setIsAddingCollege(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/colleges`,
        { name: newCollegeName.trim() }
      );
      if (response.data.success) {
        alert(response.data.message);
        setCollegesList(prev => [...prev, newCollegeName.trim()].sort());
        setNewCollegeName('');
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add college.");
    } finally {
      setIsAddingCollege(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // Verification check for admin user credentials
    if (adminUsername === 'admin@gmail.com' && adminPassword === 'Np@275151') {
      sessionStorage.setItem('adminSessionActive', 'true');
      setIsAuthenticated(true);
      setErrorMsg('');
      fetchAdminData();
      fetchColleges();
    } else {
      setErrorMsg('Invalid Admin Email or Password. Please try again.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminSessionActive');
    setIsAuthenticated(false);
    setUsers([]);
    setProducts([]);
    setFeedback([]);
    setUptime(0);
    setActiveUsers(0);
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/data`
      );
      if (response.data.success) {
        setUsers(response.data.users);
        setProducts(response.data.products);
        setFeedback(response.data.feedback);
        setUptime(response.data.uptime || 0);
        setActiveUsers(response.data.activeUsers || 0);
        setApiLimit(response.data.apiLimit || 'Unlimited');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Failed to load administrative records.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressString = (addressObj) => {
    if (!addressObj) return 'N/A';
    if (typeof addressObj === 'object') return [addressObj.city, addressObj.state].filter(Boolean).join(', ') || 'N/A';
    try {
      const parsed = JSON.parse(addressObj);
      return [parsed.city, parsed.state].filter(Boolean).join(', ') || 'N/A';
    } catch (e) {
      return addressObj;
    }
  };

  // Render the Login screen if not authorized
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-logo">🛡️ PM ADMIN</div>
            <h2>PuranaMall Admin Console</h2>
            <p>Authorized access required. Please authenticate.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            {errorMsg && <div className="admin-login-error">{errorMsg}</div>}
            
            <div className="admin-login-group">
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="admin@gmail.com"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>

            <div className="admin-login-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-login-btn">
              Authenticate Console
            </button>
          </form>
          
          <div className="admin-login-footer" onClick={() => navigate('/')}>
            ← Return to PuranaMall Home
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header bar */}
      <header className="admin-dashboard-header">
        <div className="admin-header-logo" onClick={() => navigate('/')}>
          <span>🛡️</span> PuranaMall Console
        </div>
        <div className="admin-header-actions">
          <span className="admin-badge">SYSTEM SECURE</span>
          <button className="admin-logout-btn" onClick={handleAdminLogout}>
            🔒 Exit Console
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="admin-dashboard-main">
        {/* Metric Cards Row */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="metric-info">
              <h3>Registered Users</h3>
              <div className="metric-value">{users.length}</div>
            </div>
            <div className="metric-icon users-icon">👥</div>
          </div>

          <div className="admin-metric-card">
            <div className="metric-info">
              <h3>Products Listed</h3>
              <div className="metric-value">{products.length}</div>
            </div>
            <div className="metric-icon products-icon">📦</div>
          </div>

          <div className="admin-metric-card">
            <div className="metric-info">
              <h3>Feedback Submissions</h3>
              <div className="metric-value">{feedback.length}</div>
            </div>
            <div className="metric-icon feedback-icon">💬</div>
          </div>

          <div className="admin-metric-card highlight-card">
            <div className="metric-info">
              <h3>Active Connections</h3>
              <div className="metric-value">{activeUsers} Online</div>
            </div>
            <div className="metric-icon active-icon">⚡</div>
          </div>

          <div className="admin-metric-card highlight-card">
            <div className="metric-info">
              <h3>API Request Limit</h3>
              <div className="metric-value" style={{ color: '#00b5a6' }}>{apiLimit}</div>
            </div>
            <div className="metric-icon limit-icon">🛡️</div>
          </div>

          <div className="admin-metric-card highlight-card">
            <div className="metric-info">
              <h3>Server Uptime</h3>
              <div className="metric-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{formatUptime(uptime)}</div>
            </div>
            <div className="metric-icon uptime-icon">⏳</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="admin-tab-bar">
          <button 
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users & Products Directory
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            💬 Feedback Submissions ({feedback.length})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'colleges' ? 'active' : ''}`}
            onClick={() => setActiveTab('colleges')}
          >
            🏫 Manage Colleges ({collegesList.length})
          </button>
        </div>

        {/* Content Box */}
        <div className="admin-content-card">
          {isLoading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <p>Fetching secure system records...</p>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Gender</th>
                        <th>Address</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((usr) => {
                        const userProducts = products.filter(p => p.user_id === usr.id);
                        const isExpanded = expandedUserId === usr.id;

                        return (
                          <React.Fragment key={usr.id}>
                            <tr>
                              <td className="user-id-cell">#{usr.id}</td>
                              <td><strong>{usr.name}</strong></td>
                              <td>{usr.email}</td>
                              <td>{usr.mobile_no || 'N/A'}</td>
                              <td><span className="gender-badge">{usr.gender || 'N/A'}</span></td>
                              <td>{getAddressString(usr.address)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  className={`admin-action-btn ${isExpanded ? 'active' : ''}`}
                                  onClick={() => setExpandedUserId(isExpanded ? null : usr.id)}
                                >
                                  {isExpanded ? 'Hide Ads' : `View Ads (${userProducts.length})`}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded sub-grid of products listed by this specific user */}
                            {isExpanded && (
                              <tr className="expanded-row">
                                <td colSpan="7">
                                  <div className="expanded-products-box">
                                    <h4>Ads posted by {usr.name}</h4>
                                    {userProducts.length === 0 ? (
                                      <p className="no-ads-msg">No active products listed by this user.</p>
                                    ) : (
                                      <div className="admin-sub-grid">
                                        {userProducts.map((prod) => (
                                          <div key={prod.id} className="admin-prod-strip">
                                            <img src={prod.image_url} alt={prod.name} />
                                            <div className="admin-prod-info">
                                              <h5>{prod.name}</h5>
                                              <span className="prod-cat">{prod.category}</span>
                                              <span className="prod-price">{prod.price}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="admin-feedback-feed">
                  {feedback.length === 0 ? (
                    <div className="no-feedback-box">
                      <span className="smile">😊</span>
                      <p>No user feedback submitted yet!</p>
                    </div>
                  ) : (
                    <div className="feedback-list">
                      {feedback.map((fb) => (
                        <div key={fb.id} className="admin-feedback-card">
                          <div className="feedback-card-header">
                            <div>
                              <h4>{fb.name}</h4>
                              <span className="email">{fb.email}</span>
                            </div>
                            <div className="feedback-meta">
                              <span className="rating-pill">⭐ {fb.rating} / 5</span>
                              <span className="category-tag">{fb.category || 'General'}</span>
                            </div>
                          </div>
                          <div className="feedback-card-body">
                            <p>"{fb.message}"</p>
                          </div>
                          <div className="feedback-card-footer">
                            <span>Submitted: {new Date(fb.created_at).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'colleges' && (
                <div style={{ padding: '20px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ color: 'var(--deccan-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🏫 Register New College Campus
                    </h3>
                    <p style={{ color: 'var(--deccan-text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                      Adding a new campus immediately registers it into the dynamic database. Other students will instantly see it listed in their location searches and dropdown filters in real-time!
                    </p>
                    
                    <form onSubmit={handleAddCollege} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. SRM University, Ghaziabad" 
                        value={newCollegeName}
                        onChange={(e) => setNewCollegeName(e.target.value)}
                        style={{
                          flex: 1,
                          height: '42px',
                          padding: '0 16px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={isAddingCollege}
                        style={{
                          height: '42px',
                          padding: '0 24px',
                          backgroundColor: 'var(--deccan-primary)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isAddingCollege ? "Adding..." : "+ Add College"}
                      </button>
                    </form>
                  </div>

                  <h4 style={{ color: '#fff', marginBottom: '16px' }}>Registered College Database ({collegesList.length} total)</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}>
                    {collegesList.map((col, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          color: '#e2e8f0',
                          fontSize: '13.5px'
                        }}
                      >
                        <span style={{ color: 'var(--deccan-primary)', fontWeight: 'bold' }}>{(idx + 1).toString().padStart(2, '0')}</span>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={col}>{col}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

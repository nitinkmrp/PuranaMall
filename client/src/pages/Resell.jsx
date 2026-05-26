import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resell.css';

const CATEGORIES = [
  { name: "Cars", icon: "🚗" },
  { name: "Motorcycles", icon: "🏍️" },
  { name: "Properties", icon: "🏠" },
  { name: "Gadgets", icon: "📱" },
  { name: "Tickets", icon: "🎫" },
  { name: "Electronics", icon: "⚡" },
  { name: "Health", icon: "⚕️" },
  { name: "Fashion", icon: "👕" },
  { name: "Food", icon: "🍔" },
  { name: "Baby Gear", icon: "🍼" }
];

const Resell = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [location, setLocation] = useState('Location');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [viewingMyProducts, setViewingMyProducts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState({ city: '', state: '', pincode: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    imageFile: null,
    imagePreview: null,
    show_mobile: false
  });

  useEffect(() => {
    fetchProducts();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchUnreadCount();
        
        // Auto-set navbar location to user's registered city
        if (parsedUser.address) {
          try {
            const addrObj = JSON.parse(parsedUser.address);
            if (addrObj && addrObj.city) {
              setLocation(addrObj.city);
            }
          } catch (e) {
            if (typeof parsedUser.address === 'string' && parsedUser.address.trim() !== '') {
              setLocation(parsedUser.address);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ 
        ...prev, 
        imageFile: file,
        imagePreview: URL.createObjectURL(file) 
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category || 'Electronics',
      description: product.description || '',
      price: product.price ? product.price.replace('₹', '').replace('$', '').replace('Rp. ', '') : '',
      imageFile: null,
      imagePreview: product.image_url || null,
      show_mobile: product.show_mobile || false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('category', formData.category);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price ? `₹${formData.price}` : '₹' + Math.floor(Math.random() * 200 + 20));
    submitData.append('show_mobile', formData.show_mobile);
    
    if (formData.imageFile) {
      submitData.append('image', formData.imageFile);
    } else if (formData.imagePreview && editingProductId) {
      submitData.append('image_url', formData.imagePreview);
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      };

      if (editingProductId) {
        const response = await axios.put(`http://localhost:5000/api/products/${editingProductId}`, submitData, { headers });
        if (response.data.success) {
          setProducts(products.map(p => p.id === editingProductId ? response.data.product : p));
        }
      } else {
        const response = await axios.post('http://localhost:5000/api/products', submitData, { headers });
        if (response.data.success) {
          setProducts([response.data.product, ...products]);
        }
      }
      
      setIsModalOpen(false);
      setEditingProductId(null);
      setFormData({ name: '', category: 'Electronics', description: '', price: '', imageFile: null, imagePreview: null });
    } catch (error) {
      console.error('Error uploading product:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert('Failed to list product: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfileMenu(false);
  };

  const handleEditAddressClick = () => {
    let currentCity = '', currentState = '', currentPincode = '';
    if (user.address) {
      if (typeof user.address === 'object') {
        currentCity = user.address.city || '';
        currentState = user.address.state || '';
        currentPincode = user.address.pincode || '';
      } else {
        try {
          const addr = JSON.parse(user.address);
          currentCity = addr.city || '';
          currentState = addr.state || '';
          currentPincode = addr.pincode || '';
        } catch (e) {
          currentCity = user.address;
        }
      }
    }
    setEditAddressData({ city: currentCity, state: currentState, pincode: currentPincode });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const addressString = JSON.stringify(editAddressData);
      
      const response = await axios.put('http://localhost:5000/api/auth/profile', 
        { address: addressString }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditingAddress(false);
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        if (res.data && res.data.address) {
          const city = res.data.address.city || res.data.address.town || res.data.address.state || 'Live Location';
          setLocation(city);
        } else {
          setLocation('Unknown Location');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        alert('Could not fetch location details.');
        setLocation('Location'); // Revert
      } finally {
        setIsFetchingLocation(false);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      alert('Location access denied.');
      setIsFetchingLocation(false);
      setLocation('Location');
    });
  };

  const filteredProducts = products.filter(p => {
    if (viewingMyProducts) {
      return user && p.user_id === user.id;
    }
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="olx-wrapper">
      {/* Navbar */}
      <nav className="olx-navbar">
        <div className="olx-logo" onClick={() => {setViewingMyProducts(false); setActiveCategory('All');}} style={{cursor:'pointer'}}>PuranaMall</div>
        
        <div className="olx-nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
              <a href="/chat" style={{ textDecoration: 'none', position: 'relative', fontSize: '1.2rem', cursor: 'pointer', marginRight: '10px' }}>
                💬
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-10px',
                    background: 'red', color: 'white', borderRadius: '50%',
                    padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </a>

              <div 
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  cursor: 'pointer'
                }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name}</span>
              </div>
              
              {showProfileMenu && (
                <div style={{
                  position: 'absolute', top: '120%', right: '0',
                  background: 'white', border: '1px solid #eee',
                  borderRadius: '12px', padding: '0.5rem', minWidth: '150px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100
                }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee', color: '#666', fontSize: '0.9rem' }}>
                    {user.email}
                  </div>
                  <button onClick={() => { setIsProfileModalOpen(true); setShowProfileMenu(false); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: 'none', color: 'black', textAlign: 'left', cursor: 'pointer', fontWeight: '500', borderRadius: '8px' }}>👤 My Profile</button>
                  <button onClick={() => { setViewingMyProducts(true); setShowProfileMenu(false); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: 'none', color: 'black', textAlign: 'left', cursor: 'pointer', fontWeight: '500', borderRadius: '8px' }}>📦 My Products</button>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontWeight: '500', borderRadius: '8px' }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/signup">Register</a>
              <a href="/login">Login</a>
            </>
          )}
          <button onClick={() => {
            if (!user) {
              alert("Please login first to post an ad!");
              window.location.href = "/login";
            } else {
              setIsModalOpen(true);
            }
          }}>Sell</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-container">
        <div className="hero-banner">
          <h1>Buy, Sell and Discover Everything Here</h1>
          
          <div className="olx-search-container">
            <input 
              type="text" 
              className="olx-search-input" 
              placeholder="Search for anything here..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="olx-search-btn">🔍</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="olx-main">
        {/* Categories Grid */}
        <div className="section-title">
          <span>Categories</span>
        </div>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.name} 
              className="cat-item"
              onClick={() => setActiveCategory(activeCategory === cat.name ? 'All' : cat.name)}
              style={{ background: activeCategory === cat.name ? 'rgba(255,255,255,0.7)' : 'var(--bg-glass)' }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Rekomendasi */}
        <div className="section-title">
          <span>{viewingMyProducts ? '📦 My Products' : 'Recommendations'}</span>
          {!viewingMyProducts && <a href="#" className="see-more">See more &gt;</a>}
        </div>
        
        <div className="olx-grid">
          {filteredProducts.map((product, idx) => (
            <div 
              className="olx-card" 
              key={product.id || idx}
              onClick={() => window.open(`/product/${product.id}`, '_blank')}
              style={{ cursor: 'pointer' }}
            >
              <div className="olx-card-image-wrap">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800'} 
                  alt={product.name} 
                  className="olx-card-image" 
                />
                <div className="pagination-dots">
                  <div className="dot active"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
              <div className="olx-card-content">
                <h3 className="olx-title">{product.name}</h3>
                <p className="olx-price">{product.price?.replace('$', 'Rp. ')?.replace('₹', 'Rp. ') || 'Rp. 0'}</p>
                
                <div className="olx-card-footer">
                  <div className="olx-location-date">
                    <span>📍 {(() => {
                      if (!product.user_address) return 'Local';
                      if (typeof product.user_address === 'object') return product.user_address.city || 'Local';
                      try { return JSON.parse(product.user_address).city || 'Local'; } catch (e) { return product.user_address; }
                    })()}</span>
                  </div>
                  <div className="olx-card-footer-icons">
                    <span>🔗</span>
                    <span>♡</span>
                  </div>
                </div>
                {viewingMyProducts && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(product);
                    }}
                    style={{ background: 'black', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', marginTop: '1rem', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)'}}>
              <h3>No items found.</h3>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="olx-footer">
          <div className="footer-col">
            <h4>PuranaMall Market</h4>
            <p>Careers</p>
            <p>News</p>
            <p>Instant Car Sale</p>
            <p>Credit Center</p>
            <p>Car Inspection</p>
          </div>
          <div className="footer-col">
            <h4>About Us</h4>
            <p>About PuranaMall Group</p>
            <p>Help Center</p>
            <p>Sitemap</p>
            <p>Privacy Policy</p>
            <p>Safety Tips</p>
          </div>
          <div className="footer-col">
            <h4>Follow Us</h4>
            <p>Facebook</p>
            <p>Twitter</p>
            <p>Instagram</p>
            <p>YouTube</p>
          </div>
          <div className="footer-col">
            <h4>Download App</h4>
            <div className="app-buttons">
              <button className="app-btn">App Store</button>
              <button className="app-btn">Play Store</button>
            </div>
          </div>
          
          {/* Open Source Disclaimer */}
          <div style={{
            gridColumn: '1 / -1',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            marginTop: '2rem',
            paddingTop: '2rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <p style={{ margin: 0 }}><strong>Open Source Notice:</strong> This website is an open-source project. The creators assume no responsibility or liability for any transactions, content, or interactions. Please use this platform entirely at your own risk.</p>
          </div>
        </footer>
      </main>

      {/* Sell/Edit Modal */}
      <div className={`olx-modal-overlay ${isModalOpen ? 'active' : ''}`}>
        <div className="olx-modal">
          <button type="button" className="olx-modal-close" onClick={() => {
            setIsModalOpen(false);
            setEditingProductId(null);
            setFormData({ name: '', category: 'Electronics', description: '', price: '', imageFile: null, imagePreview: null });
          }}>✕</button>
          <h2>{editingProductId ? 'Edit Your Ad' : 'Post Your Ad'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="olx-form-grid">
              
              <div className="olx-form-group full-width">
                <label>Add a Photo</label>
                <div className="olx-dropzone">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} required />
                  {formData.imagePreview ? (
                    <img src={formData.imagePreview} alt="Preview" style={{maxHeight: '150px', borderRadius: '12px'}} />
                  ) : (
                    <>
                      <div className="dropzone-icon">📸</div>
                      <p style={{margin:0, color:'var(--text-muted)'}}>Drag & drop or click to upload</p>
                    </>
                  )}
                </div>
              </div>

              <div className="olx-form-group">
                <label>Ad Title</label>
                <input 
                  type="text" name="name" 
                  className="olx-input" 
                  placeholder="Key features of your item" 
                  value={formData.name} onChange={handleInputChange} required 
                />
              </div>

              <div className="olx-form-group">
                <label>Price</label>
                <input 
                  type="number" name="price" 
                  className="olx-input" 
                  placeholder="e.g. 150" 
                  value={formData.price} onChange={handleInputChange} required 
                />
              </div>

              <div className="olx-form-group">
                <label>Category</label>
                <select name="category" className="olx-input" value={formData.category} onChange={handleInputChange} required>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="olx-form-group full-width">
                <label>Description</label>
                <textarea 
                  name="description" 
                  className="olx-input" 
                  placeholder="Include condition, features and reason for selling" 
                  rows="3"
                  value={formData.description} onChange={handleInputChange} required 
                ></textarea>
              </div>

              <div className="olx-form-group full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  name="show_mobile" 
                  id="show_mobile"
                  checked={formData.show_mobile} 
                  onChange={handleInputChange} 
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="show_mobile" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal', color: '#555' }}>
                  Share my mobile number publicly on this ad
                </label>
              </div>
            </div>

            <button type="submit" className="olx-submit-btn" disabled={isLoading}>
              {isLoading ? 'POSTING...' : 'POST NOW'}
            </button>
          </form>
        </div>
      </div>

      {/* Profile Modal */}
      <div className={`olx-modal-overlay ${isProfileModalOpen ? 'active' : ''}`}>
        <div className="olx-modal" style={{ maxWidth: '400px' }}>
          <button type="button" className="olx-modal-close" onClick={() => { setIsProfileModalOpen(false); setIsEditingAddress(false); }}>✕</button>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>My Profile</h2>
          
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-main)' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full Name</p>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>{user.name}</p>
              </div>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email</p>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>{user.email}</p>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mobile Number</p>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>{user.mobile_no || 'Not provided'}</p>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Address</p>
                  {!isEditingAddress ? (
                    <button onClick={handleEditAddressClick} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>✎ Edit</button>
                  ) : (
                    <div>
                      <button onClick={handleSaveAddress} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.9rem', marginRight: '10px', padding: 0 }}>✓ Save</button>
                      <button onClick={() => setIsEditingAddress(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>✕ Cancel</button>
                    </div>
                  )}
                </div>
                {!isEditingAddress ? (
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                    {(() => {
                      if (!user.address) return 'Not provided';
                      if (typeof user.address === 'object') {
                        const { city, state, pincode } = user.address;
                        return [city, state, pincode].filter(Boolean).join(', ') || 'Not provided';
                      }
                      try {
                        const addr = JSON.parse(user.address);
                        const { city, state, pincode } = addr;
                        return [city, state, pincode].filter(Boolean).join(', ') || 'Not provided';
                      } catch (e) {
                        return user.address;
                      }
                    })()}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" placeholder="City" value={editAddressData.city} onChange={(e) => setEditAddressData({...editAddressData, city: e.target.value})} className="olx-input" style={{ padding: '0.5rem' }} />
                    <input type="text" placeholder="State" value={editAddressData.state} onChange={(e) => setEditAddressData({...editAddressData, state: e.target.value})} className="olx-input" style={{ padding: '0.5rem' }} />
                    <input type="text" placeholder="Pincode" value={editAddressData.pincode} onChange={(e) => setEditAddressData({...editAddressData, pincode: e.target.value})} className="olx-input" style={{ padding: '0.5rem' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resell;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Resell.css';

const CATEGORIES = [
  { name: "Calculator", icon: "🧮", bg: "#ffebec" },
  { name: "Drafter", icon: "📐", bg: "#fff3e5" },
  { name: "Study Table", icon: "📚", bg: "#e6f9ed" }
];


const POPULAR_CITIES = [];

const Resell = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [location, setLocation] = useState('India');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [viewingMyProducts, setViewingMyProducts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSellRotating, setIsSellRotating] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState({ city: '', state: '', pincode: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Calculator',
    price: '',
    imageFile: null,
    imagePreview: null,
    show_mobile: false
  });

  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    rating: 5,
    category: 'General Suggestion',
    message: ''
  });
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchUnreadCount();
        
        setFeedbackData(prev => ({
          ...prev,
          name: parsedUser.name || '',
          email: parsedUser.email || ''
        }));
        
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/products`);
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/messages/unread-count`, {
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
      category: product.category || 'Calculator',
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
    submitData.append('price', formData.price ? `₹${formData.price}` : '₹' + Math.floor(Math.random() * 20000 + 200));
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
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/products/${editingProductId}`, submitData, { headers });
        if (response.data.success) {
          setProducts(products.map(p => p.id === editingProductId ? response.data.product : p));
        }
      } else {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/products`, submitData, { headers });
        if (response.data.success) {
          setProducts([response.data.product, ...products]);
        }
      }
      
      setIsModalOpen(false);
      setEditingProductId(null);
      setFormData({ name: '', category: 'Calculator', description: '', price: '', imageFile: null, imagePreview: null });
    } catch (error) {
      console.error('Error uploading product:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert('Failed to list product: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(products.filter(p => p.id !== productId));
        alert("Product deleted successfully!");
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + (error.response?.data?.message || error.message));
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
      
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/profile`, 
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
        setLocation('India'); // Revert
      } finally {
        setIsFetchingLocation(false);
        setShowLocationDropdown(false);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      alert('Location access denied.');
      setIsFetchingLocation(false);
      setLocation('India');
      setShowLocationDropdown(false);
    });
  };

  const selectPopularCity = (cityName) => {
    setLocation(cityName);
    setShowLocationDropdown(false);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const finalName = user ? user.name : feedbackData.name;
    const finalEmail = user ? user.email : feedbackData.email;

    if (!finalName || !finalEmail || !feedbackData.message) {
      alert("Please fill in all required fields!");
      return;
    }

    setIsFeedbackSubmitting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/feedback`, {
        name: finalName,
        email: finalEmail,
        rating: feedbackData.rating,
        category: feedbackData.category,
        message: feedbackData.message
      });

      if (response.data.success) {
        setFeedbackSuccess(true);
        setFeedbackData(prev => ({ ...prev, message: '' }));
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert("Failed to submit feedback: " + serverMsg);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (viewingMyProducts) {
      return user && p.user_id === user.id;
    }
    
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    
    let matchesLocation = true;
    if (location && location !== 'India' && location !== 'Location') {
      let city = '';
      if (p.user_address) {
        if (typeof p.user_address === 'object') {
          city = p.user_address.city || '';
        } else {
          try {
            city = JSON.parse(p.user_address).city || '';
          } catch (e) {
            city = p.user_address;
          }
        }
      }
      matchesLocation = city.toLowerCase().includes(location.toLowerCase()) || location.toLowerCase().includes(city.toLowerCase());
    }
    
    return matchesSearch && matchesCategory && (location === 'India' || !p.user_address || matchesLocation);
  });

  return (
    <div className="pm-wrapper">
      {/* Navbar (Sticky Header) */}
      <nav className="pm-navbar">
        <div className="pm-header-container">
          
          {/* Logo brand wordmark */}
          <div className="pm-brand-logo" onClick={() => {setViewingMyProducts(false); setActiveCategory('All'); setLocation('India'); setSearchQuery('');}} title="PuranaMall Home">
            <svg viewBox="0 0 400 80" width="145" height="34" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="60" font-family="'Roboto', 'Helvetica Neue', sans-serif" font-size="58" font-weight="900" fill="#002f34" letter-spacing="-3">PuranaMall</text>
              <circle cx="288" cy="20" r="8" fill="#00a8b5" />
            </svg>
          </div>
          
          {/* Location Search selector box */}
          <div className="pm-location-search-box">
            <span className="loc-icon">🔍</span>
            <input 
              type="text" 
              value={isFetchingLocation ? "Fetching location..." : location} 
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search city, state..." 
              onFocus={() => setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            />
            <span className="dropdown-arrow" onClick={() => setShowLocationDropdown(!showLocationDropdown)}>▼</span>
            
            {showLocationDropdown && (
              <div className="pm-location-dropdown">
                <div className="pm-location-dropdown-item" onClick={fetchLiveLocation} style={{ fontWeight: 'bold', color: '#002f34' }}>
                  🎯 Use current location
                </div>
                {POPULAR_CITIES.map(city => (
                  <div key={city} className="pm-location-dropdown-item" onClick={() => selectPopularCity(city)}>
                    📍 {city}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Global Search text-bar input */}
          <div className="pm-global-search-bar">
            <input 
              type="text" 
              placeholder="Find Cars, Mobile Phones and more..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-button-wrap" onClick={fetchProducts}>
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M409.6 0C183.4 0 0 183.4 0 409.6S183.4 819.2 409.6 819.2c92.8 0 178.6-30.8 247.8-82.6l234.4 234.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L702.6 691.2C788.4 610.8 819.2 516.4 819.2 409.6 819.2 183.4 635.8 0 409.6 0zm0 128c155.6 0 281.6 126 281.6 281.6S565.2 691.2 409.6 691.2 128 565.2 128 409.6 254 128 409.6 128z" />
              </svg>
            </div>
          </div>
          
          {/* Language selector dropdown */}
          <div className="pm-lang-switcher">
            <span>English</span>
            <span style={{ fontSize: '10px' }}>▼</span>
          </div>
          
          {/* Right hand side action list */}
          <div className="pm-nav-user-actions">
            {user ? (
              <>
                {user.email === 'admin@gmail.com' && (
                  <button 
                    className="pm-admin-panel-nav-btn"
                    title="Access Admin Console"
                    onClick={() => navigate('/admin')}
                  >
                    🛡️ Admin Console
                  </button>
                )}
                <button className="pm-heart-btn" title="Favorites" onClick={() => alert("Added to favorites!")}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                
                <a href="/chat" className="pm-chat-icon-nav whatsapp-style" title="Messages">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.82 1.452 5.4 0 9.794-4.392 9.797-9.798.002-2.618-1.01-5.078-2.852-6.921C16.57 2.045 14.113 1.03 11.5 1.03 6.1 1.03 1.706 5.421 1.703 10.829c0 1.689.447 3.333 1.298 4.774l-1.02 3.725 3.822-.997c1.433.782 2.923 1.196 4.417 1.196c.004 0 .004 0 0 0z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="pm-chat-badge">
                      {unreadCount}
                    </span>
                  )}
                </a>

                {/* Profile menu dropdown button trigger */}
                <div 
                  className="pm-profile-trigger"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="pm-user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="pm-profile-name">{user.name}</span>
                  <span style={{ fontSize: '10px' }}>▼</span>
                  
                  {showProfileMenu && (
                    <div className="pm-profile-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="pm-profile-menu-header">
                        <div className="name">{user.name}</div>
                        <div className="email">{user.email}</div>
                      </div>
                      <button className="pm-profile-menu-btn" onClick={() => { setIsProfileModalOpen(true); setShowProfileMenu(false); }}>
                        👤 My Profile
                      </button>
                      <button className="pm-profile-menu-btn" onClick={() => { setViewingMyProducts(true); setShowProfileMenu(false); }}>
                        📦 My Products
                      </button>
                      <button className="pm-profile-menu-btn logout" onClick={handleLogout}>
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <a href="/login" className="pm-login-link">Login</a>
            )}
            
            {/* The multi-colour gradient Sell button */}
            <button className="pm-sell-btn" onClick={() => {
              setIsSellRotating(true);
              setTimeout(() => setIsSellRotating(false), 600);
              if (!user) {
                alert("Please login first to post an ad!");
                window.location.href = "/login";
              } else {
                setIsModalOpen(true);
              }
            }}>
              <svg className={`pm-sell-icon ${isSellRotating ? 'rotate-anim' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5-3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
              <span>SELL</span>
            </button>
          </div>
          
        </div>
      </nav>
      


      {/* Hero Banner Section */}
      <div className="hero-container">
        <div className="pm-banner-promo">
          <div className="pm-banner-content">
            <h2>Buy, Sell and Discover Everything Here</h2>
            <p>List your cars, gadgets, real estate properties, and fashion apparel in minutes for FREE!</p>
          </div>
          <div className="pm-banner-actions">
            <button onClick={() => {
              if (!user) {
                window.location.href = "/login";
              } else {
                setIsModalOpen(true);
              }
            }}>
              Post an Ad Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pm-main">
        
        {/* Categories Capsule Grid */}
        <div className="section-title">
          <span>Browse Categories</span>
        </div>
        <div className="category-capsule-grid">
          <div className="cat-capsule-item" style={{ background: '#f0f3f4', borderLeft: '4px solid #002f34' }} onClick={() => {setActiveCategory('All'); setViewingMyProducts(false);}}>
            <span className="cat-capsule-icon">📁</span>
            <span className="cat-capsule-name">All Items</span>
          </div>
          {CATEGORIES.map(cat => (
            <div 
              key={cat.name} 
              className="cat-capsule-item"
              style={{ background: cat.bg, borderLeft: `4px solid ${cat.name === 'Calculator' ? '#ff3838' : cat.name === 'Drafter' ? '#ff9f43' : '#2ecc71'}` }}
              onClick={() => {setActiveCategory(cat.name); setViewingMyProducts(false);}}
            >
              <span className="cat-capsule-icon">{cat.icon}</span>
              <span className="cat-capsule-name">{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Recommendations list grid */}
        <div className="section-title">
          <span>{viewingMyProducts ? '📦 My Listed Products' : `Fresh Recommendations in ${location}`}</span>
          {!viewingMyProducts && <span className="see-more" onClick={() => {setActiveCategory('All'); setLocation('India');}}>View All</span>}
        </div>
        
        <div className="pm-grid">
          {filteredProducts.map((product, idx) => {
            const isPromoPosition = idx === 3 && !viewingMyProducts; // Render a promo ad card natively in the grid
            return (
              <React.Fragment key={product.id || idx}>
                {isPromoPosition && (
                  <div className="pm-promo-inline-card">
                    <div>
                      <h3 className="pm-promo-title">Want to see your stuff here?</h3>
                      <p className="pm-promo-text">Make some extra cash by selling things in your community. It's fast, free, and easy!</p>
                    </div>
                    <button className="pm-promo-btn" onClick={() => {
                      if (!user) window.location.href = "/login";
                      else setIsModalOpen(true);
                    }}>
                      Start Selling
                    </button>
                  </div>
                )}
                
                <div 
                  className="pm-card" 
                  onClick={() => window.open(`/product/${product.id}`, '_blank')}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Floating heart watchlist */}
                  <button className="pm-card-fav-floating" onClick={(e) => { e.stopPropagation(); alert("Saved to watchlist!"); }} title="Favorite">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>

                  <div className="pm-card-image-wrap">
                    {idx % 3 === 0 && <div className="pm-featured-badge">Featured</div>}
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800'} 
                      alt={product.name} 
                      className="pm-card-image" 
                    />
                  </div>
                  
                  <div className="pm-card-content">
                    <p className="pm-price">
                      {product.price?.startsWith('₹') ? product.price : `₹${product.price || '0'}`}
                    </p>
                    <h3 className="pm-title" title={product.name}>{product.name}</h3>
                    
                    <div className="pm-card-footer">
                      <div className="pm-location-date">
                        📍 {(() => {
                          if (!product.user_address) return 'Delhi';
                          if (typeof product.user_address === 'object') return product.user_address.city || 'Delhi';
                          try { return JSON.parse(product.user_address).city || 'Delhi'; } catch (e) { return product.user_address; }
                        })()}
                      </div>
                      <div>
                        {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'}) : 'Today'}
                      </div>
                    </div>

                    {/* Instant Interaction Actions overlay block */}
                    <div className="pm-card-instant-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button"
                        className="pm-instant-btn pm-instant-msg"
                        title="Chat Instantly"
                        onClick={() => {
                          if (!user) {
                            alert("Please log in to chat with the seller!");
                            navigate('/login');
                          } else if (user.id === product.user_id) {
                            alert("You cannot chat with yourself on your own product listing!");
                          } else {
                            navigate(`/chat/${product.user_id}/${product.id}`);
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                        </svg>
                        <span>Chat</span>
                      </button>

                      <button 
                        type="button"
                        className="pm-instant-btn pm-instant-call"
                        title="Call Instantly"
                        onClick={() => {
                          if (product.show_mobile && product.mobile_no) {
                            alert(`📞 Seller Contact Details:\n\nName: ${product.user_name || 'Classifieds Seller'}\nPhone: ${product.mobile_no}\n\nYou can dial this number to speak directly!`);
                          } else {
                            alert(`🔒 Phone Details Locked:\n\nSeller ${product.user_name || 'Classifieds Seller'} has kept their phone number private. Please use the instant Chat feature to contact them!`);
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                        </svg>
                        <span>Call</span>
                      </button>
                    </div>
                    
                    {viewingMyProducts && (
                      <div className="pm-my-product-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="pm-my-product-edit-btn"
                          onClick={() => openEditModal(product)}
                        >
                          ✎ Edit Product
                        </button>
                        <button 
                          className="pm-my-product-delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          🗑 Delete Product
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          {filteredProducts.length === 0 && (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--pm-text-light)'}}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ margin: '1rem 0' }}>No recommendations found in this location/category.</h3>
              <p style={{ color: 'var(--pm-text-light)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {setActiveCategory('All'); setLocation('India'); setSearchQuery('');}}>
                Reset filters to view all products
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Interactive Feedback Form Section */}
      <section className="pm-feedback-section">
        <div className="pm-feedback-container">
          <div className="pm-feedback-info">
            <h2>We Value Your Feedback</h2>
            <p>Help us improve PuranaMall! Share your thoughts, report listing issues, or submit suggestions directly to our backend server.</p>
            <div className="pm-feedback-rating-preview">
              <span className="pm-feedback-stars-display">★★★★★</span>
              <p>Join thousands of users building a cleaner, premium community trading platform.</p>
            </div>
          </div>
          
          <div className="pm-feedback-divider"></div>

          <div className="pm-feedback-form-box">
            {feedbackSuccess ? (
              <div className="pm-feedback-success-state">
                <span className="success-icon">✓</span>
                <h3>Feedback Received!</h3>
                <p>Thank you for helping us make PuranaMall the best place to trade locally. Your response has been securely logged in our database.</p>
                <button type="button" onClick={() => setFeedbackSuccess(false)} className="pm-feedback-btn-reset">
                  Submit another feedback
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="pm-feedback-form">
                {!user && (
                  <div className="pm-feedback-row">
                    <div className="pm-feedback-group">
                      <label>Your Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={feedbackData.name} 
                        onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="pm-feedback-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="john@example.com" 
                        value={feedbackData.email} 
                        onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>
                )}
                
                <div className="pm-feedback-row">
                  <div className="pm-feedback-group">
                    <label>Feedback Category</label>
                    <select 
                      value={feedbackData.category} 
                      onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                    >
                      <option value="General Suggestion">General Suggestion</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Listing Issue">Listing Issue</option>
                      <option value="User Experience">User Experience</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="pm-feedback-group">
                    <label>Rating</label>
                    <div className="pm-feedback-stars-wrap">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={`star-icon ${feedbackData.rating >= star ? 'active' : ''}`}
                          onClick={() => setFeedbackData({...feedbackData, rating: star})}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pm-feedback-group">
                  <label>Your Message</label>
                  <textarea 
                    placeholder="Describe your suggestion, complaint or observation here..." 
                    rows="3"
                    value={feedbackData.message}
                    onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="pm-feedback-submit-btn" disabled={isFeedbackSubmitting}>
                  {isFeedbackSubmitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Official 4-Column PuranaMall Footer */}
      <footer className="pm-footer">
        <div className="pm-footer-top-columns" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="pm-footer-column">
            <h4>About Us</h4>
            <ul className="pm-footer-links-list">
              <li><a href="#">About PuranaMall Group</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">PuranaMall People</a></li>
            </ul>
          </div>
          <div className="pm-footer-column">
            <h4>PuranaMall</h4>
            <ul className="pm-footer-links-list">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Sitemap</a></li>
              <li><a href="#">Legal & Privacy Information</a></li>
              <li><a href="#">Vulnerability Disclosure Program</a></li>
            </ul>
          </div>
          <div className="pm-footer-column">
            <h4>Follow Us</h4>
            <div className="pm-footer-social-wrap">
              <a href="#" className="pm-footer-social-icon facebook" title="Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="#" className="pm-footer-social-icon twitter" title="Twitter / X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="pm-footer-social-icon instagram" title="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" className="pm-footer-social-icon youtube" title="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.503a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.503a3.003 3.003 0 002.11-2.11c.502-1.87.502-5.837.502-5.837s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="#" className="pm-footer-social-icon linkedin" title="LinkedIn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="pm-footer-column pm-newsletter-column">
            <h4>Join Our Newsletter</h4>
            <p className="pm-newsletter-desc">Get the latest updates on hot deals, verified listings, and local promotions directly in your inbox!</p>
            <form className="pm-newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Successfully subscribed! Check your inbox."); }}>
              <input type="email" placeholder="Enter your email" required className="pm-newsletter-input" />
              <button type="submit" className="pm-newsletter-btn">→</button>
            </form>
          </div>
        </div>
        
        {/* Dark Teal Bottom strip branding bar */}
        <div className="pm-footer-bottom-strip">
          <div className="pm-footer-bottom-container" style={{ justifyContent: 'center' }}>
            <span className="pm-copyright-text">
              All rights reserved © 2006-2026 PuranaMall India
            </span>
          </div>
        </div>
      </footer>

      {/* Post/Edit Product Modal */}
      <div className={`pm-modal-overlay ${isModalOpen ? 'active' : ''}`}>
        <div className="pm-modal">
          <button type="button" className="pm-modal-close" onClick={() => {
            setIsModalOpen(false);
            setEditingProductId(null);
            setFormData({ name: '', category: 'Calculator', description: '', price: '', imageFile: null, imagePreview: null });
          }}>✕</button>
          <h2>{editingProductId ? 'Edit Your Listing' : 'Post Your Ad'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="pm-form-grid">
              
              <div className="pm-form-group">
                <label>Upload Image</label>
                <div className="pm-dropzone">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} required={!editingProductId} />
                  {formData.imagePreview ? (
                    <img src={formData.imagePreview} alt="Preview" style={{maxHeight: '150px', borderRadius: '4px', border: '1px solid var(--pm-border-gray)'}} />
                  ) : (
                    <>
                      <div className="dropzone-icon">📸</div>
                      <p style={{margin:0, fontSize: '13px', color:'var(--pm-text-light)'}}>Drag & drop or click to upload</p>
                    </>
                  )}
                </div>
              </div>

              <div className="pm-form-group">
                <label>Listing Title</label>
                <input 
                  type="text" name="name" 
                  className="pm-input" 
                  placeholder="Key features of your item (brand, model, etc.)" 
                  value={formData.name} onChange={handleInputChange} required 
                />
              </div>

              <div className="pm-form-group">
                <label>Price (INR)</label>
                <input 
                  type="number" name="price" 
                  className="pm-input" 
                  placeholder="e.g. 15000" 
                  value={formData.price} onChange={handleInputChange} required 
                />
              </div>

              <div className="pm-form-group">
                <label>Category</label>
                <select name="category" className="pm-input" value={formData.category} onChange={handleInputChange} required>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="pm-form-group">
                <label>Item Description</label>
                <textarea 
                  name="description" 
                  className="pm-input" 
                  placeholder="Describe the condition, usage, and key details" 
                  rows="4"
                  value={formData.description} onChange={handleInputChange} required 
                ></textarea>
              </div>

              <div className="pm-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  name="show_mobile" 
                  id="show_mobile"
                  checked={formData.show_mobile} 
                  onChange={handleInputChange} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="show_mobile" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal', color: 'var(--pm-text-secondary)', fontSize: '13px' }}>
                  Share my mobile number publicly on this ad listing
                </label>
              </div>
            </div>

            <button type="submit" className="pm-submit-btn" disabled={isLoading}>
              {isLoading ? 'UPLOADING LISTING...' : 'POST NOW'}
            </button>
          </form>
        </div>
      </div>

      {/* User Profile Modal */}
      <div className={`pm-modal-overlay ${isProfileModalOpen ? 'active' : ''}`}>
        <div className="pm-modal" style={{ maxWidth: '420px' }}>
          <button type="button" className="pm-modal-close" onClick={() => { setIsProfileModalOpen(false); setIsEditingAddress(false); }}>✕</button>
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>My Account Profile</h2>
          
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ border: '1px solid var(--pm-border-gray)', padding: '12px 16px', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--pm-text-light)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Full Name</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: 'var(--pm-text-main)' }}>{user.name}</p>
              </div>
              
              <div style={{ border: '1px solid var(--pm-border-gray)', padding: '12px 16px', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--pm-text-light)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Email Address</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: 'var(--pm-text-main)' }}>{user.email}</p>
              </div>

              <div style={{ border: '1px solid var(--pm-border-gray)', padding: '12px 16px', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--pm-text-light)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Mobile Number</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: 'var(--pm-text-main)' }}>{user.mobile_no || 'Not provided'}</p>
              </div>

              <div style={{ border: '1px solid var(--pm-border-gray)', padding: '12px 16px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ margin: 0, color: 'var(--pm-text-light)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Address</p>
                  {!isEditingAddress ? (
                    <button onClick={handleEditAddressClick} style={{ background: 'transparent', border: 'none', color: '#00a8b5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>✎ EDIT</button>
                  ) : (
                    <div>
                      <button onClick={handleSaveAddress} style={{ background: 'transparent', border: 'none', color: 'var(--pm-success)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginRight: '10px', padding: 0 }}>✓ SAVE</button>
                      <button onClick={() => setIsEditingAddress(false)} style={{ background: 'transparent', border: 'none', color: 'var(--pm-error)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>✕ CANCEL</button>
                    </div>
                  )}
                </div>
                {!isEditingAddress ? (
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: 'var(--pm-text-main)' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <input type="text" placeholder="City" value={editAddressData.city} onChange={(e) => setEditAddressData({...editAddressData, city: e.target.value})} className="pm-input" style={{ height: '36px', fontSize: '14px' }} />
                    <input type="text" placeholder="State" value={editAddressData.state} onChange={(e) => setEditAddressData({...editAddressData, state: e.target.value})} className="pm-input" style={{ height: '36px', fontSize: '14px' }} />
                    <input type="text" placeholder="Pincode" value={editAddressData.pincode} onChange={(e) => setEditAddressData({...editAddressData, pincode: e.target.value})} className="pm-input" style={{ height: '36px', fontSize: '14px' }} />
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Resell.css';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        fetchUnreadCount();
      } catch (e) {}
    }

    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const getAddressString = (addressObj) => {
    if (!addressObj) return 'India';
    if (typeof addressObj === 'object') return [addressObj.city, addressObj.state].filter(Boolean).join(', ') || 'India';
    try {
      const parsed = JSON.parse(addressObj);
      return [parsed.city, parsed.state].filter(Boolean).join(', ') || 'India';
    } catch (e) {
      return addressObj;
    }
  };

  const getFullAddressString = (addressObj) => {
    if (!addressObj) return 'India';
    if (typeof addressObj === 'object') return [addressObj.city, addressObj.state, addressObj.pincode].filter(Boolean).join(', ') || 'India';
    try {
      const parsed = JSON.parse(addressObj);
      return [parsed.city, parsed.state, parsed.pincode].filter(Boolean).join(', ') || 'India';
    } catch (e) {
      return addressObj;
    }
  };

  return (
    <div className="pm-wrapper">
      {/* Navbar (Consistent Header across pages) */}
      <nav className="pm-navbar">
        <div className="pm-header-container">
          
          {/* Logo brand wordmark */}
          <div className="pm-brand-logo" onClick={() => navigate('/')} title="PuranaMall Home">
            <svg viewBox="0 0 400 80" width="145" height="34" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="60" font-family="'Roboto', 'Helvetica Neue', sans-serif" font-size="58" font-weight="900" fill="#002f34" letter-spacing="-3">PuranaMall</text>
              <circle cx="288" cy="20" r="8" fill="#00a8b5" />
            </svg>
          </div>
          
          {/* Static Location (Simple display on product detail navbar) */}
          <div className="pm-location-search-box" style={{ width: '220px', minWidth: '220px' }}>
            <span className="loc-icon">📍</span>
            <input 
              type="text" 
              value={product ? getAddressString(product.user_address) : "India"} 
              readOnly
              style={{ cursor: 'default' }}
            />
          </div>
          
          {/* Global Search text-bar input (Redirects back to home for search) */}
          <div className="pm-global-search-bar" style={{ flexGrow: 1 }}>
            <input 
              type="text" 
              placeholder="Find Cars, Mobile Phones and more..." 
              onClick={() => navigate('/')}
              readOnly
              style={{ cursor: 'pointer' }}
            />
            <div className="search-button-wrap" onClick={() => navigate('/')}>
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M409.6 0C183.4 0 0 183.4 0 409.6S183.4 819.2 409.6 819.2c92.8 0 178.6-30.8 247.8-82.6l234.4 234.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L702.6 691.2C788.4 610.8 819.2 516.4 819.2 409.6 819.2 183.4 635.8 0 409.6 0zm0 128c155.6 0 281.6 126 281.6 281.6S565.2 691.2 409.6 691.2 128 565.2 128 409.6 254 128 409.6 128z" />
              </svg>
            </div>
          </div>
          
          {/* Language switcher */}
          <div className="pm-lang-switcher">
            <span>English</span>
            <span style={{ fontSize: '10px' }}>▼</span>
          </div>
          
          {/* Right hand actions */}
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
                      <button className="pm-profile-menu-btn" onClick={() => { navigate('/'); }}>
                        📦 Browse Marketplace
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
            
            <button className="pm-sell-btn" onClick={() => navigate('/')}>
              + SELL
            </button>
          </div>
          
        </div>
      </nav>

      {/* Main product detail container */}
      <main className="product-detail-main">
        {loading ? (
          <div className="loading-state">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            Loading product details...
          </div>
        ) : !product ? (
          <div className="error-state">
            <h2>Product listing not found</h2>
            <button onClick={() => navigate('/')}>Return to Marketplace</button>
          </div>
        ) : (
          <div className="product-container">
            
            {/* Left Column: Image box and Description details */}
            <div className="product-left-column">
              <div className="product-image-container">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=1200'} 
                  alt={product.name} 
                  className="product-main-image"
                />
              </div>
              
              <div className="product-description-section">
                <h3>Product Specifications</h3>
                <span className="detail-category">
                  <strong>Category:</strong> {product.category || 'Classified Ad'}
                </span>
                <div className="detail-description">
                  {product.description || 'No detailed description provided by the seller.'}
                </div>
              </div>
            </div>
            
            {/* Right Column: Pricing details, Seller card & map */}
            <div className="product-info-sidebar">
              
              {/* Product title & price card */}
              <div className="product-price-box">
                <div className="detail-price-row">
                  <h1 className="detail-price">
                    {product.price?.startsWith('₹') ? product.price : `₹${product.price || '0'}`}
                  </h1>
                  <div className="detail-action-buttons">
                    <button className="detail-action-icon-btn" title="Share" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Ad link copied to clipboard!"); }}>
                      <svg viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                      </svg>
                    </button>
                    <button className="detail-action-icon-btn" title="Add to Wishlist" onClick={() => alert("Added to watchlist!")}>
                      <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <h2 className="detail-title">{product.name}</h2>
                
                <div className="detail-location-date">
                  <span>📍 {getAddressString(product.user_address)}</span>
                  <span>Listed: {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN', {month: 'short', day: 'numeric', year: 'numeric'}) : 'Today'}</span>
                </div>
              </div>
              
              {/* Seller details card */}
              <div className="product-seller-box">
                <h3>Seller Profile</h3>
                <div className="seller-profile">
                  <div className="seller-avatar">
                    {product.user_name ? product.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="seller-profile-info">
                    <h4 className="seller-name">{product.user_name || 'Classifieds Seller'}</h4>
                    <p className="seller-member-since">Member since Jan 2024</p>
                  </div>
                </div>
                
                {product.show_mobile && product.mobile_no && (
                  <div className="seller-mobile-block">
                    <span>📞 Contact: {product.mobile_no}</span>
                  </div>
                )}
                
                <button 
                  className="chat-btn" 
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else if (user.id === product.user_id) {
                      alert("You cannot chat with yourself on your own product listing!");
                    } else {
                      navigate(`/chat/${product.user_id}/${product.id}`);
                    }
                  }}
                  style={{ marginTop: '16px' }}
                >
                  💬 CHAT WITH SELLER
                </button>
              </div>

              {/* Geographical details map block */}
              <div className="product-location-box">
                <h3>Posted In Location</h3>
                <p style={{ margin: '0', fontSize: '14px', color: 'var(--pm-text-secondary)' }}>
                  📍 {getFullAddressString(product.user_address)}
                </p>
                <div className="location-map-mock">
                  📌 Location coordinates locked
                </div>
              </div>
              
            </div>
            
          </div>
        )}
      </main>

      {/* Official 4-Column PuranaMall Footer */}
      <footer className="pm-footer">
        <div className="pm-footer-top-columns" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="pm-footer-column">
            <h4>About Us</h4>
            <ul className="pm-footer-links-list">
              <li><a href="#" onClick={() => navigate('/')}>About PuranaMall Group</a></li>
              <li><a href="#" onClick={() => navigate('/')}>Careers</a></li>
              <li><a href="#" onClick={() => navigate('/')}>Contact Us</a></li>
              <li><a href="#" onClick={() => navigate('/')}>PuranaMall People</a></li>
            </ul>
          </div>
          <div className="pm-footer-column">
            <h4>PuranaMall</h4>
            <ul className="pm-footer-links-list">
              <li><a href="#" onClick={() => navigate('/')}>Help Center</a></li>
              <li><a href="#" onClick={() => navigate('/')}>Sitemap</a></li>
              <li><a href="#" onClick={() => navigate('/')}>Legal & Privacy Information</a></li>
              <li><a href="#" onClick={() => navigate('/')}>Vulnerability Disclosure Program</a></li>
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
        
        {/* Bottom Brand Strip */}
        <div className="pm-footer-bottom-strip">
          <div className="pm-footer-bottom-container" style={{ justifyContent: 'center' }}>
            <span className="pm-copyright-text">
              All rights reserved © 2006-2026 PuranaMall India
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;

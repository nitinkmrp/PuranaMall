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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const getAddressString = (addressObj) => {
    if (!addressObj) return 'Not provided';
    if (typeof addressObj === 'object') return [addressObj.city, addressObj.state, addressObj.pincode].filter(Boolean).join(', ') || 'Not provided';
    try {
      const parsed = JSON.parse(addressObj);
      return [parsed.city, parsed.state, parsed.pincode].filter(Boolean).join(', ') || 'Not provided';
    } catch (e) {
      return addressObj;
    }
  };

  return (
    <div className="olx-wrapper">
      {/* Navbar - simplified version for product page */}
      <nav className="olx-navbar">
        <div className="olx-logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>PuranaMall</div>
        
        <div className="olx-nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>{user.name}</span>
            </div>
          ) : (
            <>
              <a href="/signup">Register</a>
              <a href="/login">Login</a>
            </>
          )}
          <button onClick={() => navigate('/')}>Back</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="product-detail-main">
        {loading ? (
          <div className="loading-state">Loading product details...</div>
        ) : !product ? (
          <div className="error-state">
            <h2>Product not found</h2>
            <button onClick={() => navigate('/')}>Return to Home</button>
          </div>
        ) : (
          <div className="product-container">
            {/* Top section: Left Image, Right Info */}
            <div className="product-hero-section">
              <div className="product-image-container">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=1200'} 
                  alt={product.name} 
                  className="product-main-image"
                />
              </div>
              
              <div className="product-info-sidebar">
                <div className="product-price-box">
                  <h1 className="detail-price">{product.price?.replace('$', 'Rp. ')?.replace('₹', 'Rp. ') || 'Rp. 0'}</h1>
                  <h2 className="detail-title">{product.name}</h2>
                  <div className="detail-location-date">
                    <span>📍 {getAddressString(product.user_address)}</span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="product-seller-box">
                  <h3>Seller Description</h3>
                  <div className="seller-profile">
                    <div className="seller-avatar">
                      {product.user_name ? product.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="seller-name">{product.user_name || 'Anonymous User'}</h4>
                      <p className="seller-member-since">Member since 2024</p>
                      {product.show_mobile && product.mobile_no && (
                        <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#10b981' }}>
                          📞 {product.mobile_no}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    className="chat-btn" 
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                      } else if (user.id === product.user_id) {
                        alert("You can't chat with yourself!");
                      } else {
                        navigate(`/chat/${product.user_id}/${product.id}`);
                      }
                    }}
                  >
                    Chat with seller
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom section: Description */}
            <div className="product-description-section">
              <h3>Description</h3>
              <p className="detail-category"><strong>Category:</strong> {product.category || 'N/A'}</p>
              <div className="detail-description">
                {product.description || 'No description provided by the seller.'}
              </div>
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
};

export default ProductDetail;

import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const DEFAULT_COLLEGES = [
  "ABES Engineering College, Ghaziabad",
  "Jaipuria Institute of Management, Ghaziabad",
  "Ajay Kumar Garg Institute of Management (AKGIM), Ghaziabad",
  "Ajay Kumar Garg Engineering College (AKGEC), Ghaziabad",
  "Institute of Technology and Science (I.T.S), Ghaziabad",
  "Nitra Technical Campus (NTC), Ghaziabad",
  "ABES Institute of Technology (ABESIT), Ghaziabad",
  "Dr. Ram Manohar Lohia College of Pharmacy (Dr.RMLCP), Ghaziabad",
  "H.R. Institute of Hotel Management (HRIHM), Ghaziabad",
  "IMS Engineering College (IMSEC), Ghaziabad",
  "HR Institute of Engineering and Technology (HRIET), Ghaziabad",
  "Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad",
  "Inderprastha Engineering College (IPEC), Ghaziabad",
  "Babu Banarasi Das Institute of Technology (BBDIT), Ghaziabad",
  "Unique Institute of Management and Technology (UIMT), Ghaziabad",
  "Modinagar Institute of Technology (MIT), Ghaziabad",
  "ITS Pharmacy College, Ghaziabad",
  "Raj Kumar Goel Institute of Technology & Management (RKGITM), Ghaziabad",
  "JMS Institute of Technology, Ghaziabad",
  "Vivekanand Institute of Technology and Science (VITS), Ghaziabad",
  "BBDIT College of Pharmacy, Ghaziabad",
  "RD Engineering College, Ghaziabad",
  "HR Institute of Pharmacy (HRIP), Ghaziabad",
  "DJ College of Pharmacy (DJCOP), Modinagar",
  "Oxford College of Pharmacy, Ghaziabad",
  "Institute of Advanced Management & Research (IAMR), Ghaziabad",
  "Divya Jyoti College of Engineering and Technology (DJCET), Ghaziabad",
  "D. S. Institute of Technology & Management (DSITM), Ghaziabad",
  "Krishna Engineering College (KEC), Ghaziabad",
  "Rishi Chadha Vishvas Girls Institute of Technology (RCVGIT), Ghaziabad",
  "Lord Krishna College of Engineering (LKCE), Ghaziabad",
  "Bhagwant Institute of Technology (BIT), Ghaziabad",
  "Aryan Institute of Technology (AIT), Ghaziabad",
  "K.S. Jain Institute of Engineering and Technology, Ghaziabad",
  "HR Institute of Professional Studies (HRIPS), Ghaziabad"
];

export default function Signup() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('pm-theme') || 'dark');
  const [colleges, setColleges] = useState(DEFAULT_COLLEGES);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    document.body.className = `deccan-theme ${theme}-mode`;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pm-theme', newTheme);
  };

  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    gender: "",
    address: {
      city: "",
      state: "",
      pincode: "",
      college: ""
    },
    password: ""
  });

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/colleges`);
        if (response.data.success) {
          setColleges(response.data.colleges);
        }
      } catch (error) {
        console.error("Error fetching dynamic colleges list:", error);
      }
    };
    fetchColleges();
  }, []);

  useEffect(() => {
    if (formData.address.college) {
      setCollegeSearchQuery(formData.address.college);
    }
  }, [formData.address.college]);

  const handleCollegeSearchChange = (e) => {
    const val = e.target.value;
    setCollegeSearchQuery(val);
    if (!val) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          college: ""
        }
      }));
    }
  };

  const handleSelectCollege = (college) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        college: college
      }
    }));
    setCollegeSearchQuery(college);
    setShowCollegeDropdown(false);
  };

  const filteredColleges = colleges.filter(c =>
    c.toLowerCase().includes(collegeSearchQuery.toLowerCase())
  );

  const fetchGeoLocation = () => {
    if (navigator.geolocation) {
      setIsFetchingGeo(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Using openstreetmap Nominatim reverse geocoding API
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            if (response.data && response.data.address) {
              const addr = response.data.address;
              const fetchedCity = addr.city || addr.town || addr.village || addr.suburb || "";
              const fetchedState = addr.state || "";
              const fetchedPincode = addr.postcode || "";
              
              setFormData((prev) => ({
                ...prev,
                address: {
                  ...prev.address,
                  city: fetchedCity,
                  state: fetchedState,
                  pincode: fetchedPincode
                }
              }));
            }
          } catch (err) {
            console.error("Error auto-fetching location details:", err);
          } finally {
            setIsFetchingGeo(false);
          }
        },
        (err) => {
          console.error("Geolocation error during signup:", err);
          setIsFetchingGeo(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    fetchGeoLocation();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddress = (e) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!formData.address.college || !formData.address.college.trim()) {
      alert("Please select a college name from the list. College name is a mandatory field.");
      return;
    }

    if (!colleges.includes(formData.address.college)) {
      alert("Please select a valid college name from the searchable dropdown list.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/send-otp`,
        { email: formData.email }
      );

      alert(res.data.message);
      if (res.data.success) {
        setShowOtpModal(true);
        setResendTimer(60);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to send verification OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    setOtpLoading(true);
    try {
      const payload = {
        ...formData,
        otp,
        address: typeof formData.address === 'object' ? JSON.stringify(formData.address) : formData.address
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/signup`,
        payload
      );

      alert(res.data.message);
      if (res.data.success) {
        setShowOtpModal(false);
        navigate("/login");
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setOtpLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/send-otp`,
        { email: formData.email }
      );
      alert("Verification OTP has been resent successfully!");
      setResendTimer(60);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to resend OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className={`auth-wrapper deccan-theme ${theme}-mode`}>
      {/* Background ambient lighting and grid layer for Deccan Experts feel */}
      <div className="deccan-glow-blob-1"></div>
      <div className="deccan-glow-blob-2"></div>
      <div className="deccan-grid-overlay"></div>

      {/* Floating brand header */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 400 80" width="130" height="30" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="60" fontSize="58" fontWeight="900" fill="var(--deccan-text-main)" letterSpacing="-3">PuranaMall</text>
            <circle cx="288" cy="20" r="8" fill="var(--deccan-primary)" />
          </svg>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="pm-theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            style={{
              background: 'rgba(255, 56, 56, 0.1)',
              border: '1px solid rgba(255, 56, 56, 0.3)',
              color: '#ff3838',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 56, 56, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 56, 56, 0.1)'; }}
          >
            ✕ Quit
          </button>
        </div>
      </div>

      <div className="auth-container signup-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join PuranaMall Next and start trading locally</p>
        </div>

        <form onSubmit={handleSendOtp} className="auth-form">
          <div className="auth-form-grid">
            
            <div className="auth-form-group">
              <label className="auth-label">Full Name <span style={{ color: '#ff4a4a', marginLeft: '4px' }}>*</span></label>
              <input
                className="auth-input"
                type="text"
                name="name"
                placeholder="John Doe"
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Email Address <span style={{ color: '#ff4a4a', marginLeft: '4px' }}>*</span></label>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Mobile Number</label>
              <input
                className="auth-input"
                type="text"
                name="mobile_no"
                placeholder="+1 234 567 890"
                onChange={handleChange}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Gender</label>
              <select
                className="auth-select"
                name="gender"
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="auth-form-group full-width" style={{marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px"}}>
              <label className="auth-label" style={{margin: 0}}>Address Details</label>
              <button 
                type="button" 
                onClick={fetchGeoLocation}
                disabled={isFetchingGeo}
                className="auth-fetch-geo-btn"
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: isFetchingGeo ? "#1b2c34" : "#00a8b5",
                  color: isFetchingGeo ? "#7a8a90" : "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: isFetchingGeo ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: isFetchingGeo ? "none" : "0 2px 6px rgba(0, 168, 181, 0.2)"
                }}
              >
                {isFetchingGeo ? "⏳ Fetching Location..." : "🎯 Auto-fetch Location"}
              </button>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">City</label>
              <input
                className="auth-input"
                type="text"
                name="city"
                placeholder="City"
                value={formData.address.city || ""}
                onChange={handleAddress}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">State</label>
              <input
                className="auth-input"
                type="text"
                name="state"
                placeholder="State"
                value={formData.address.state || ""}
                onChange={handleAddress}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Pincode</label>
              <input
                className="auth-input"
                type="text"
                name="pincode"
                placeholder="Zip / Pincode"
                value={formData.address.pincode || ""}
                onChange={handleAddress}
              />
            </div>

            <div className="auth-form-group full-width" style={{ position: 'relative' }}>
              <label className="auth-label">College Name <span style={{ color: '#ff4a4a', marginLeft: '4px' }}>*</span></label>
              <input
                className="auth-input"
                type="text"
                placeholder="Type to search college (e.g. ABES)..."
                value={collegeSearchQuery}
                onChange={handleCollegeSearchChange}
                onFocus={() => setShowCollegeDropdown(true)}
                onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 250)}
                required
                style={{
                  width: '100%',
                  cursor: 'text',
                  paddingRight: '40px'
                }}
              />
              {/* Dropdown indicator arrow */}
              <span 
                onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '46px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: 'var(--deccan-text-light)',
                  userSelect: 'none',
                  zIndex: 2
                }}
              >
                ▼
              </span>

              {showCollegeDropdown && (
                <div 
                  className="deccan-glass-card"
                  style={{
                    position: 'absolute',
                    top: '82px',
                    left: 0,
                    right: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 100,
                    borderRadius: '12px',
                    border: '1px solid var(--deccan-border)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    backgroundColor: 'var(--deccan-card-fill)',
                    backdropFilter: 'blur(20px)',
                    marginTop: '4px'
                  }}
                >
                  {filteredColleges.length === 0 ? (
                    <div style={{ padding: '12px 16px', color: 'var(--deccan-text-light)', fontSize: '14px' }}>
                      No matching colleges found
                    </div>
                  ) : (
                    filteredColleges.map((college, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectCollege(college)}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: 'var(--deccan-text-main)',
                          transition: 'all 0.2s ease',
                          borderBottom: idx === filteredColleges.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--deccan-primary)';
                          e.target.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--deccan-text-main)';
                        }}
                      >
                        🎓 {college}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password <span style={{ color: '#ff4a4a', marginLeft: '4px' }}>*</span></label>
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>

          </div>

          <button type="submit" className="auth-submit-btn" disabled={otpLoading}>
            {otpLoading ? "Sending OTP..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>

      {showOtpModal && (
        <div className="otp-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="deccan-glass-card" style={{
            maxWidth: '420px',
            width: '100%',
            padding: '40px',
            borderRadius: '16px',
            border: '1px solid var(--deccan-border)',
            backgroundColor: 'var(--deccan-card-fill)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{ color: 'var(--deccan-primary)', marginBottom: '10px', fontSize: '24px', fontWeight: '800' }}>Verify Your Email</h2>
            <p style={{ color: 'var(--deccan-text-light)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              We've dispatched a 6-digit verification code to <strong>{formData.email}</strong>. Please enter the OTP below to activate your account.
            </p>

            <form onSubmit={handleVerifyAndSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--deccan-border)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--deccan-text-main)',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                disabled={otpLoading}
                className="auth-submit-btn"
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--deccan-primary)',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 168, 181, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {otpLoading ? "Verifying..." : "Verify & Complete Signup"}
              </button>
            </form>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || otpLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendTimer > 0 ? 'var(--deccan-text-light)' : 'var(--deccan-primary)',
                  cursor: resendTimer > 0 ? 'default' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textDecoration: resendTimer > 0 ? 'none' : 'underline'
                }}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4a4a',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
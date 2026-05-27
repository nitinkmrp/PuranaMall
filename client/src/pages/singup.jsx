import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    gender: "",
    address: {
      city: "",
      state: "",
      pincode: ""
    },
    password: ""
  });

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

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {
      const payload = {
        ...formData,
        address: typeof formData.address === 'object' ? JSON.stringify(formData.address) : formData.address
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/signup`,
        payload
      );

      alert(res.data.message);

      console.log(res.data);
      
      if (res.data.success) {
        navigate("/login");
      }

    } catch (error) {
      alert(error.response?.data?.message || error.message || "An error occurred during signup");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container signup-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join PuranaMall Next and start trading locally</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-grid">
            
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
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
              <label className="auth-label">Email Address</label>
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

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
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

          <button type="submit" className="auth-submit-btn">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}